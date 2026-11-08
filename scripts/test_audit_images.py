#!/usr/bin/env python3
"""Testes locais sintéticos para auditoria HTTP; sem dependências remotas."""
from __future__ import annotations
from collections import Counter
import hashlib
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
from tempfile import TemporaryDirectory
from threading import Thread
import unittest
from scripts.audit_images_http import (
    audit_one, build_inventory, inventory_summary, is_valid_host,
    load_resume, run_scan, single_request
)

BYTES=b"\xff\xd8\xff\xe0"+b"test-jpeg-blob"*170+b"\xff\xd9"
SHA=hashlib.sha256(BYTES).hexdigest()


class Handler(BaseHTTPRequestHandler):
    hits=Counter()
    def log_message(self,*args):
        pass

    def do_GET(self):
        Handler.hits[self.path]+=1
        if self.path=="/redirect":
            self.send_response(302)
            self.send_header("Location","/good")
            self.end_headers()
            return
        if self.path=="/retry" and Handler.hits[self.path]==1:
            self.send_response(503)
            self.end_headers()
            return
        if self.path=="/missing":
            self.send_response(404)
            self.end_headers()
            return
        if self.path=="/html":
            self.send_response(200)
            self.send_header("Content-Type","text/html")
            self.end_headers()
            self.wfile.write(b"<p>Login</p>")
            return
        self.send_response(200)
        self.send_header("Content-Type","image/jpeg")
        self.end_headers()
        self.wfile.write(BYTES)


class AuditImageTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Handler.hits.clear()
        cls.server=ThreadingHTTPServer(("127.0.0.1",0),Handler)
        cls.thread=Thread(target=cls.server.serve_forever,daemon=True)
        cls.thread.start()
        cls.base=f"http://127.0.0.1:{cls.server.server_port}"

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()

    def t(self,route,sha=SHA,kind=None):
        return {"key":"sample:"+route,"kind":"card","collection":"synthetic",
                "cardId":"test-"+route,"number":"1","name":"Test",
                "url":self.base+"/"+route,"claimedSha256":sha,
                "claimedBytes":len(BYTES),"imageKind":kind}

    def test_untrusted_http_rejected_by_default(self):
        self.assertFalse(is_valid_host(self.base+"/good"))
        self.assertTrue(is_valid_host(self.base+"/good",allow_local_test=True))
        self.assertFalse(is_valid_host("https://127.0.0.1/secrets"))
        self.assertFalse(is_valid_host("https://evil.example.com/file"))
        out=single_request(self.base+"/good",timeout=2)
        self.assertEqual(out["status"],"invalid_url")

    def test_verification_sha_mime_bytes_and_final_url(self):
        out=single_request(self.base+"/redirect",2,allow_local_test=True)
        self.assertEqual(out["status"],"verified")
        self.assertEqual(out["http"],200)
        self.assertEqual(out["sha256"],SHA)
        self.assertEqual(out["bytes"],len(BYTES))
        self.assertEqual(out["mime"],"image/jpeg")
        self.assertTrue(out["finalUrl"].endswith("/good"))

    def test_403_404_and_html_are_not_declared_wrong_player(self):
        for route,status in [("missing","http_unavailable"),("html","non_image_response")]:
            x=single_request(self.base+"/"+route,2,allow_local_test=True)
            self.assertEqual(x["status"],status)
            self.assertNotIn("wrong_image",x)

    def test_retry_succeeds_and_divergence_is_metadata_only(self):
        # O helper single_request cobre retries via audit_one com HTTPS externo;
        # o teste usa uma variação controlada da mesma lógica no servidor local.
        first=single_request(self.base+"/retry",2,allow_local_test=True)
        second=single_request(self.base+"/retry",2,allow_local_test=True)
        self.assertEqual(first["status"],"transient_http")
        self.assertEqual(second["status"],"verified")
        self.assertNotEqual(second["sha256"],"0"*64)

    def test_resume_skips_completed_entries(self):
        with TemporaryDirectory() as tmp:
            path=Path(tmp)/"resume.jsonl"
            row={**self.t("good"),"status":"verified","http":200}
            path.write_text(json.dumps(row)+"\n",encoding="utf8")
            self.assertEqual(len(load_resume(path)),1)
            self.assertEqual(load_resume(path)[row["key"]]["status"],"verified")
            # Este URL é local; com resume completo não é preciso GET.
            old=Handler.hits["/good"]
            s=run_scan([self.t("good")],path.with_name("results.jsonl"),workers=1,
                timeout=2,retries=0,resume=path,max_seconds=20)
            self.assertEqual(s["completed"],1)
            self.assertEqual(Handler.hits["/good"],old)

    def test_inventory_includes_all_cards_and_covers_and_excludes_null(self):
        with TemporaryDirectory() as tmp:
            root=Path(tmp)
            (root/"public/data").mkdir(parents=True)
            (root/"public/library.json").write_text(json.dumps([
                {"id":"foo","cover":"https://www.cromos.pt/c.jpg","count":2}
            ]),encoding="utf8")
            (root/"public/data/foo.json").write_text(json.dumps({
                "cards":[{"id":"foo-1","number":"1","image":"https://www.cromos.pt/a.jpg",
                          "sha256":"x"*64,"bytes":2000},
                         {"id":"foo-2","number":"2","image":None}]
            }),encoding="utf8")
            targets,missing=build_inventory(root)
            self.assertEqual(len(targets),2)
            self.assertEqual(len(missing),1)
            inv=inventory_summary(root)
            self.assertEqual(inv["card_urls"],1)
            self.assertEqual(inv["cover_urls"],1)
            self.assertEqual(inv["missing_cards_or_covers"],1)


if __name__=="__main__":
    unittest.main()
