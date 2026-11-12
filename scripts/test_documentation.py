"""Regressões documentais — validação local, nunca imports/deploy."""
from __future__ import annotations

import hashlib
import json
import re
import unittest
from pathlib import Path
from urllib.parse import unquote, urlsplit

from scripts.refresh_documentation import ROOT, metrics, outputs, year_start

DOCS=[
    "README.md","docs/README.md","docs/01-gestao/README.md",
    "docs/01-gestao/CHECKPOINT.md","docs/01-gestao/DECISOES.md",
    "docs/02-colecoes/README.md","docs/03-catalogos/README.md",
    "docs/04-imagens/README.md","docs/05-funcionalidades/README.md",
    "docs/06-arquitetura/README.md","docs/07-seguranca/README.md",
    "docs/08-github-vercel/README.md","docs/09-auditorias/README.md",
    "docs/10-backlog/README.md","docs/CLASSIFICACAO.md",
    "docs/HISTORICO.md","docs/MANUTENCAO.md",
    "docs/GOOGLE_DRIVE_STORAGE.md"
]


class DocumentationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.state=metrics()

    def test_metrics_exactly_match_all_json_and_manifest(self):
        m=self.state
        new_ids=("futebol-2013-14","futebol-2012-13")
        fresh=[json.loads((ROOT/f"public/data/{slug}.json").read_text(encoding="utf-8")) for slug in new_ids]
        newly_verified=sum(c["available"] for album in fresh for c in album["cards"])
        newly_missing=sum(not c["available"] for album in fresh for c in album["cards"])
        self.assertEqual((m["activeCollections"],m["positions"],m["sections"]),
                         (53,29492,1612+sum(len(album["sections"]) for album in fresh)))
        self.assertEqual((m["cardsWithSHA"],m["previewLinksUnverified"],
                          m["missingImagePositions"]),(26529+newly_verified,0,2065+newly_missing))
        self.assertEqual(m["cardsWithImageURL"]+m["totalCoversWithURL"],26580+newly_verified+2)
        self.assertEqual(m["collectionsWithMissingImages"],18+sum(
            any(not c["available"] for c in album["cards"]) for album in fresh))
        self.assertEqual(m["portalCategories"],
                         dict(portugal=14,selecoes=25,champions=7,outros=7))
        self.assertEqual(m["roadmap"],
                         dict(goal=36,candidates=36,integrated=32,blocked=4,pending=0))

    def test_generated_documents_match_source_bytes(self):
        for path,expected in outputs(self.state).items():
            with self.subTest(path=path):
                self.assertEqual((ROOT/path).read_text(encoding="utf-8"),expected)

    def test_archive_is_exact_pr1_original_snapshot(self):
        # Blob SHA do ficheiro original no PR #1 de 29 coleções.
        path=ROOT/"docs/01-gestao/README-original-2026-11-08.md"
        raw=path.read_bytes()
        git_blob=hashlib.sha1(b"blob "+str(len(raw)).encode()+b"\0"+raw).hexdigest()
        self.assertEqual(git_blob,"bb0d548f9bb25bc5bc6131641016b5fcd8a8ecba")
        self.assertIn("vinte e nove coleções",raw.decode("utf-8"))

    def test_original_source_map_is_explicitly_historical(self):
        data=json.loads((ROOT/"docs/source-map.json").read_text(encoding="utf-8"))
        self.assertEqual(data["snapshotType"],"historical")
        self.assertEqual(sum(data["counts"].values()),76)
        self.assertEqual(len(data["files"]),76)
        self.assertEqual(data["baseCommit"],
                         "4fc739b7b425a62fbd3e80add57380405a86e607")
        self.assertEqual(data["supersededBy"],"docs/metrics-current.json")

    def test_root_readme_and_drive_guide_have_current_controls(self):
        readme=(ROOT/"README.md").read_text()
        self.assertIn("53 coleções",readme.split("## Estado")[0])
        self.assertIn("29.492",readme.split("## Estado")[0])
        self.assertNotIn("trinta e nove coleções ativas",readme.split("## Estado")[0])
        for token in ("npm ci", "localStorage", "Backup", "FUT / validate",
                      "d5fb60eec0801808ec2946385a14c8c9226df54d"):
            self.assertIn(token.lower(),readme.lower())
        guide=(ROOT/"docs/GOOGLE_DRIVE_STORAGE.md").read_text()
        for required in ("--plan","--prepare","--validate","--promote","--resume",
                         "fut-active.json","FUT_STORAGE_BACKEND","não foi feita migração",
                         "sem fallback externo","--expected-active"):
            self.assertIn(required,guide)
        self.assertNotIn("migrate-drive.mjs --images",guide)

    def test_internal_markdown_links_resolve_in_repository(self):
        broken=[]
        for name in DOCS:
            file=ROOT/name
            self.assertTrue(file.is_file(),name)
            text=file.read_text(encoding="utf-8")
            # Links Markdown; histórico original não é revalidado/reescrito.
            for dest in re.findall(r"\]\(([^)\s]+)(?:\s+\"[^\"]+\")?\)",text):
                dest=unquote(dest)
                if (dest.startswith(("http://","https://","mailto:","data:","#"))
                        or dest.startswith("javascript:")):
                    continue
                target=dest.split("#",1)[0].split("?",1)[0]
                if not target:
                    continue
                resolved=(file.parent/target).resolve()
                if not resolved.is_relative_to(ROOT.resolve()) or not resolved.exists():
                    broken.append((name,target))
        self.assertEqual(broken,[])

    def test_year_parser_matches_portal_order(self):
        self.assertEqual(year_start("26/27"),2026)
        self.assertEqual(year_start("98/99"),1998)
        self.assertEqual(year_start("2025"),2025)
        self.assertEqual(year_start("2014"),2014)


if __name__=="__main__":
    unittest.main()
