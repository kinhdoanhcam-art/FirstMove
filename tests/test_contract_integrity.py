import ast
import pathlib
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[1]
SOURCE_PATH = ROOT / "contracts" / "StepOrder.py"
SOURCE = SOURCE_PATH.read_text(encoding="utf-8")
TREE = ast.parse(SOURCE)


class ContractIntegrityTests(unittest.TestCase):
    def test_header_is_exact_v0216(self):
        self.assertEqual(
            SOURCE.splitlines()[:4],
            [
                "# v0.2.16",
                '# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }',
                "",
                "from genlayer import *",
            ],
        )

    def test_forbidden_v03_and_external_features_are_absent(self):
        for forbidden in (
            "import genlayer as gl",
            "gl.contract.Contract",
            "run_nondet(",
            "message.raw",
            "nondet.web.render",
            "time.time",
            "datetime.now",
            "emit_transfer",
            "payable",
            "gl.evm",
        ):
            self.assertNotIn(forbidden, SOURCE)

    def test_only_classifier_calls_the_model(self):
        self.assertEqual(SOURCE.count("gl.nondet.exec_prompt"), 1)
        self.assertEqual(SOURCE.count("gl.vm.run_nondet_unsafe"), 1)
        start = SOURCE.index("def _classify_order")
        end = SOURCE.index("# WRITE 1", start)
        classifier = SOURCE[start:end]
        self.assertIn("gl.nondet.exec_prompt", classifier)
        self.assertIn("gl.vm.run_nondet_unsafe", classifier)

    def test_no_public_preview_or_order_mutator_exists(self):
        names = {node.name for node in ast.walk(TREE) if isinstance(node, ast.FunctionDef)}
        self.assertFalse(any(name.startswith(("preview_", "classify_", "dry_run_")) for name in names))
        self.assertNotIn("set_order", names)
        self.assertNotIn("change_order", names)

    def test_withdraw_checks_first_move_before_open_state(self):
        start = SOURCE.index("def withdraw_before_first_move")
        end = SOURCE.index("# VIEWS", start)
        method = SOURCE[start:end]
        self.assertLess(method.index('arrangement.first_mover != ""'), method.index('arrangement.state != "OPEN"'))

    def test_both_order_teeth_and_first_movers_are_present(self):
        for text in (
            "The other side moves first",
            "The author moves first",
            'arrangement.first_mover = "AUTHOR"',
            'arrangement.first_mover = "OTHER"',
        ):
            self.assertIn(text, SOURCE)


if __name__ == "__main__":
    unittest.main()
