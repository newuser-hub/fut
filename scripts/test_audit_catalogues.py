#!/usr/bin/env python3
"""Testes sintéticos determinísticos da auditoria editorial; sem escrita de dados."""
import copy
import unittest

from scripts.audit_catalogues_deep import audit_data, normalized, semantic_name


def make_card(slug,number,name,section="FC Porto",sha=None,source_id=None):
    c={"id":f"{slug}-{number}","number":str(number),"originalNumber":str(number),
       "name":name,"section":section,"category":section,"order":int(number),
       "optional":False,"available":False,"sha256":sha,"sourceId":source_id}
    return c


def sample():
    entries=[]
    cats={}
    for slug in ("alpha","beta"):
        cards=[
            make_card(slug,1,"Diogo Costa",sha="a"*64,source_id=100 if slug=="alpha" else 200),
            make_card(slug,2,"Pepe",sha="b"*64 if slug=="alpha" else "c"*64,
                      source_id=101 if slug=="alpha" else 201)]
        cats[slug]={"id":slug,"sections":["FC Porto"],"cards":cards}
        entries.append({"id":slug,"title":slug,"count":2,"sections":1,"status":"active"})
    return entries,cats


class DeepAuditTests(unittest.TestCase):
    def test_clean_cross_edition_names_and_reused_image_are_not_critical(self):
        lib,cats=sample()
        before=copy.deepcopy(cats)
        report=audit_data(lib,cats)
        self.assertEqual(report["summary"]["critical_findings"],0)
        self.assertEqual(report["summary"]["positions"],4)
        self.assertEqual(report["summary"]["names_repeated_across_editions_informational"],2)
        self.assertEqual(report["summary"]["same_image_across_catalogues_groups"],1)
        self.assertEqual(cats,before,"Auditoria nunca muta catálogos")

    def test_same_section_identical_names_is_review_only(self):
        lib,cats=sample()
        cats["alpha"]["cards"][1]["name"]="Diogo Costa"
        report=audit_data(lib,cats)
        self.assertEqual(report["summary"]["critical_findings"],0)
        self.assertEqual(report["summary"]["exact_name_groups_same_section"],1)
        self.assertIn("same_section_exact_name",report["counts_by_kind"])

    def test_semantic_normalization_and_variants(self):
        self.assertEqual(normalized(" João  Félix "),normalized("JOAO-FELIX"))
        self.assertEqual(semantic_name("Diogo Costa (FC Porto)"),"diogo costa")
        lib,cats=sample()
        cats["alpha"]["cards"][1]["name"]="Diogo Costa (FC Porto)"
        report=audit_data(lib,cats)
        self.assertEqual(report["summary"]["critical_findings"],0)
        self.assertEqual(report["summary"]["semantic_name_groups_same_section"],1)

    def test_bad_references_ids_numbers_source_ids_detected(self):
        lib,cats=sample()
        c=cats["alpha"]["cards"][1]
        c["id"]=cats["alpha"]["cards"][0]["id"]
        c["number"]="1"
        c["section"]="Não existe"
        c["sourceId"]=100
        report=audit_data(lib,cats)
        self.assertGreaterEqual(report["summary"]["critical_findings"],4)
        for key in ("duplicate_or_invalid_card_id","duplicate_or_invalid_card_number",
                    "missing_section_reference","duplicate_source_id"):
            self.assertIn(key,report["counts_by_kind"])

    def test_original_numbers_preserved_but_discrepancies_flagged(self):
        lib,cats=sample()
        cats["alpha"]["cards"][0]["originalNumber"]="001"
        cats["alpha"]["cards"][1].pop("originalNumber")
        report=audit_data(lib,cats)
        self.assertEqual(report["summary"]["originalNumber_different"],1)
        self.assertEqual(report["summary"]["originalNumber_missing"],1)
        self.assertEqual(report["summary"]["critical_findings"],0)

    def test_duplicate_sections_are_review_not_destructive(self):
        lib,cats=sample()
        cats["alpha"]["sections"].append("FC Pôrto")
        lib[0]["sections"]=2
        report=audit_data(lib,cats)
        self.assertIn("duplicate_section",report["counts_by_kind"])
        self.assertEqual(report["summary"]["critical_findings"],0)


if __name__=="__main__":
    unittest.main()
