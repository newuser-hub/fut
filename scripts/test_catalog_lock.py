"""Teste real de corrida do lock com Git remoto local. Nunca contacta GitHub."""
from __future__ import annotations

import os
import subprocess
import tempfile
import time
import unittest
from pathlib import Path

SCRIPT=Path(__file__).resolve().parent/"catalog-write-lock.sh"
LOCK="refs/heads/ci/fut-catalog-write-lock"


def cmd(*args,cwd=None,env=None):
    return subprocess.run(args,cwd=cwd,env=env,text=True,
                          check=True,capture_output=True).stdout.strip()


class CatalogLockIntegrationTests(unittest.TestCase):
    def test_two_authorized_runs_both_execute_serially_and_release_lock(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder)
            remote=root/"remote.git"
            seed=root/"seed"
            a=root/"worker-a"
            b=root/"worker-b"
            marker=root/"events.txt"
            cmd("git","init","--bare","-b","main",str(remote))
            cmd("git","init","-b","main",str(seed))
            cmd("git","config","user.name","synthetic",cwd=seed)
            cmd("git","config","user.email","synthetic@example.invalid",cwd=seed)
            (seed/"README.md").write_text("synthetic repository")
            cmd("git","add","README.md",cwd=seed)
            cmd("git","commit","-m","initial",cwd=seed)
            cmd("git","remote","add","origin",str(remote),cwd=seed)
            cmd("git","push","origin","main",cwd=seed)
            cmd("git","clone",str(remote),str(a))
            cmd("git","clone",str(remote),str(b))
            env=os.environ.copy()
            env.update({"GITHUB_REF":"refs/heads/main",
                        "GITHUB_RUN_ATTEMPT":"1",
                        "GITHUB_WORKFLOW":"synthetic-test",
                        "FUT_LOCK_POLL_SECONDS":"0.2"})
            wrapper=[
                "bash",str(SCRIPT),"--","bash","-c",
                'echo "start:$1" >> "$2"; sleep "$3"; echo "end:$1" >> "$2"',
                "synthetic"
            ]
            # Não disparar importação: ambos os filhos escrevem apenas num
            # ficheiro TEMP de observação, nunca na main.
            env_a={**env,"GITHUB_RUN_ID":"5001"}
            env_b={**env,"GITHUB_RUN_ID":"5002"}
            first=subprocess.Popen(
                wrapper+["a",str(marker),"1.2"],
                cwd=a,env=env_a,text=True,
                stdout=subprocess.PIPE,stderr=subprocess.PIPE
            )
            deadline=time.time()+8
            while time.time()<deadline:
                exists=cmd("git","ls-remote",str(remote),LOCK)
                if exists and marker.exists():
                    break
                time.sleep(.05)
            else:
                first.kill()
                first.communicate()
                self.fail("Primeira execução não adquiriu lock")
            second=subprocess.Popen(
                wrapper+["b",str(marker),"0.1"],
                cwd=b,env=env_b,text=True,
                stdout=subprocess.PIPE,stderr=subprocess.PIPE
            )
            out1,err1=first.communicate(timeout=20)
            out2,err2=second.communicate(timeout=20)
            self.assertEqual(first.returncode,0,err1+out1)
            self.assertEqual(second.returncode,0,err2+out2)
            self.assertEqual(
                marker.read_text().splitlines(),
                ["start:a","end:a","start:b","end:b"]
            )
            self.assertEqual(cmd("git","ls-remote",str(remote),LOCK),"")
            self.assertEqual(
                cmd("git","rev-parse","main",cwd=seed),
                cmd("git","rev-parse","main",cwd=a)
            )

    def test_fails_closed_outside_main(self):
        with tempfile.TemporaryDirectory() as folder:
            env={**os.environ,
                "GITHUB_REF":"refs/heads/audit/fut-2026-11-08",
                "GITHUB_RUN_ID":"5003","GITHUB_RUN_ATTEMPT":"1"}
            r=subprocess.run(
                ["bash",str(SCRIPT),"--","true"],cwd=folder,env=env,
                capture_output=True,text=True
            )
            self.assertEqual(r.returncode,2)
            self.assertIn("apenas em main",r.stderr)


if __name__=="__main__":
    unittest.main()
