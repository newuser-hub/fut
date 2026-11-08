import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from scripts import verify_catalog_transaction as v


class CatalogTransactionTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        root = Path(self.tmp.name)
        self.patch_root = patch.object(v, "ROOT", root)
        self.patch_root.start()
        self.addCleanup(self.patch_root.stop)
        (root / "src").mkdir()
        (root / "public/data").mkdir(parents=True)
        self.html = 'const stateKey = id => "fut.album."+id+".progress.v1";'
        (root / "src/index.html").write_text(self.html)
        (root / "public/index.html").write_text(self.html)
        self.request = {
            "version": 1,
            "collections": [
                {"id": "album-a", "sourceId": 101},
                {"id": "album-b", "sourceId": 102},
            ]
        }
        self.old = [
            {"id": "legacy", "status": "active", "count": 1, "sections": 1},
        ]
        self.published = [dict(x) for x in self.old] + [
            {"id": slug, "status": "active", "count": 2, "sections": 1}
            for slug in ("album-a", "album-b")
        ]
        (root / "public/library.json").write_text(json.dumps(self.published))
        for slug, source_id in (("album-a", 101), ("album-b", 102)):
            (root / f"public/data/{slug}.json").write_text(json.dumps({
                "id": slug, "sourceCollectionId": source_id,
                "cards": [
                    {"id": slug + "-1", "number": "1"},
                    {"id": slug + "-2", "number": "2"}
                ],
                "sections": ["Main"]
            }))
        self.changed = [
            "public/library.json", "public/data/album-a.json",
            "public/data/album-b.json"
        ]
        self.mock_git = patch.object(v, "git", side_effect=self.fake_git)
        self.mock_base = patch.object(v, "base", side_effect=self.fake_base)
        self.mock_git.start()
        self.mock_base.start()
        self.addCleanup(self.mock_git.stop)
        self.addCleanup(self.mock_base.stop)

    def fake_git(self, *args):
        if args[:2] == ("diff", "--cached"):
            return "\n".join(self.changed)
        if args == ("diff", "--name-only", "--"):
            return ""
        raise ValueError(args)

    def fake_base(self, path):
        if path == "public/library.json":
            return self.old
        raise ValueError(path)

    def test_exact_two_collections_pass_before_commit(self):
        v.verify("next", self.request)

    def test_request_duplicate_or_incomplete_is_not_authorized(self):
        for items in ([], [self.request["collections"][0]],
                      [self.request["collections"][0]] * 2):
            with self.subTest(items=items):
                with self.assertRaises(ValueError):
                    v.scope("next", {"collections": items})

    def test_roadmap_requires_exact_source_authorization(self):
        r = {**self.request, "authorizedSourceIds": [101, 999],
             "auditPipelineVersion": 2}
        with self.assertRaisesRegex(ValueError, "IDs autorizados"):
            v.scope("roadmap", r)
        r["authorizedSourceIds"] = [101, 102]
        self.assertEqual(v.scope("roadmap", r), ["album-a", "album-b"])

    def test_catalogue_cannot_be_missing(self):
        p = Path(self.tmp.name) / "public/data/album-b.json"
        p.unlink()
        with self.assertRaises(FileNotFoundError):
            v.verify("next", self.request)

    def test_source_id_cannot_drift(self):
        p = Path(self.tmp.name) / "public/data/album-a.json"
        data = json.loads(p.read_text())
        data["sourceCollectionId"] = 404
        p.write_text(json.dumps(data))
        with self.assertRaisesRegex(ValueError, "Origem divergente"):
            v.verify("next", self.request)

    def test_unrelated_collection_must_remain_unchanged(self):
        self.published[0]["count"] = 999
        p = Path(self.tmp.name) / "public/library.json"
        p.write_text(json.dumps(self.published))
        with self.assertRaisesRegex(ValueError, "anterior modificada"):
            v.verify("next", self.request)

    def test_wrong_catalogue_in_commit_rejected(self):
        self.changed.append("public/data/unrelated.json")
        with self.assertRaisesRegex(ValueError, "fora do lote"):
            v.verify("next", self.request)

    def test_partial_commit_without_selected_catalogue_rejected(self):
        self.changed = ["public/library.json", "src/index.html"]
        with self.assertRaisesRegex(ValueError, "Commit parcial"):
            v.verify("next", self.request)

    def test_partial_commit_without_manifest_rejected(self):
        self.changed = ["public/data/album-a.json"]
        with self.assertRaisesRegex(ValueError, "Commit parcial"):
            v.verify("next", self.request)

    def test_noop_idempotent_for_already_integrated_batch(self):
        self.changed = []
        v.verify("next", self.request)

    def test_progress_key_must_not_change(self):
        root = Path(self.tmp.name)
        (root / "src/index.html").write_text("other frontend")
        (root / "public/index.html").write_text("other frontend")
        with self.assertRaisesRegex(ValueError, "progresso"):
            v.verify("next", self.request)


if __name__ == "__main__":
    unittest.main()
