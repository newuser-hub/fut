"""CI de segurança: quatro importadores, uma exclusão mútua, zero cancelamento.

Inspeção estática: nenhum teste cria lock remoto nem publica catálogos.
"""
from pathlib import Path
import subprocess
import unittest

ROOT=Path(__file__).resolve().parent.parent
WRITERS={
    ".github/workflows/ingest-next-batch.yml":"next",
    ".github/workflows/ingest-roadmap-batch.yml":"roadmap",
    ".github/workflows/ingest-premier-league.yml":"premier",
    ".github/workflows/audit-italia-franca.yml":"leagues",
}


class CatalogWorkflowTests(unittest.TestCase):
    def test_all_writers_use_same_exclusive_lock_without_pending_eviction(self):
        for path,mode in WRITERS.items():
            with self.subTest(path=path):
                text=(ROOT/path).read_text()
                self.assertIn("scripts/catalog-write-lock.sh",text)
                self.assertIn("scripts/catalog-publish-batch.sh "+mode,text)
                self.assertIn("contents: write",text)
                self.assertIn("workflow_dispatch:",text)
                self.assertNotIn("  push:",text,"Importadores exigem execução explícita")
                self.assertNotIn("concurrency:\n  group:",text)
                self.assertNotIn("cancel-in-progress: true",text)
                self.assertNotIn("git push origin",text)
                self.assertIn("fetch-depth: 0",text)

    def test_lock_is_atomic_and_released_with_owner_guard(self):
        text=(ROOT/"scripts/catalog-write-lock.sh").read_text()
        self.assertIn("refs/heads/ci/fut-catalog-write-lock",text)
        self.assertIn('git commit-tree "$tree"',text)
        self.assertIn('git push --quiet origin "$commit:$LOCK_REF"',text)
        self.assertIn('if [[ "$current" != "$commit" ]]',text)
        self.assertIn('trap release EXIT',text)
        self.assertNotIn("--force",text.replace("sem --force",""))

    def test_publisher_pins_request_and_validates_exact_batch(self):
        text=(ROOT/"scripts/catalog-publish-batch.sh").read_text()
        for snippet in ('git show "$sha:$path"', 'git fetch --no-tags origin main',
                        'git checkout -B fut-ci-catalog-writer origin/main',
                        'scripts/verify_catalog_transaction.py',
                        'node --test scripts/test-frontend-progress.mjs',
                        'git push origin HEAD:refs/heads/main'):
            self.assertIn(snippet,text)
        self.assertLess(text.index("scripts/verify_catalog_transaction.py"),
                        text.index('git commit -m'))
        self.assertNotIn("git push --force",text)
        self.assertNotIn("git rebase",text)

    def test_ci_pr_and_all_project_surfaces_without_secrets(self):
        text=(ROOT/".github/workflows/ci.yml").read_text()
        for snippet in ('pull_request:', 'push:', 'npm ci', 'src/index.html',
                        'test-frontend-progress.mjs', 'test-access-security.mjs',
                        'test-drive-migration.mjs','verify_catalogs.py',
                        'verify_expansion_plan.py','test-verify-fut-deployment.mjs',
                        'scripts.test_catalog_transaction'):
            self.assertIn(snippet,text)
        self.assertIn("contents: read",text)
        self.assertNotIn("contents: write",text)
        self.assertIn("FUT_STORAGE_BACKEND: ''",text)

    def test_access_check_requires_sha_ready_before_testing_sites(self):
        workflow=(ROOT/".github/workflows/verify-fut-access.yml").read_text()
        script=(ROOT/"scripts/verify-fut-deployment.mjs").read_text()
        self.assertIn("secrets.VERCEL_TOKEN",workflow)
        self.assertIn("github.sha",workflow)
        self.assertIn("confirmExactDeployment",script)
        self.assertIn("auditHostPaths",script)
        self.assertLess(script.index("const deployment=await confirmExactDeployment"),
                        script.index("for(const host of HOSTS)checks.push"))
        self.assertIn("application_basic_401",script)
        self.assertIn("platform_or_deployment_protection",script)
        self.assertIn("PENDENTE: VERCEL_TOKEN",script)

    def test_bash_syntax(self):
        subprocess.run(["bash","-n","scripts/catalog-write-lock.sh",
                        "scripts/catalog-publish-batch.sh"],cwd=ROOT,check=True)


if __name__=="__main__":
    unittest.main()
