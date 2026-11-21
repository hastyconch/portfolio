"""Self-test for portfolio_guard.py: python3 factory/hooks/test_portfolio_guard.py"""

import json
import subprocess
import sys
from pathlib import Path

GUARD = Path(__file__).with_name("portfolio_guard.py")
PUSH = "git " + "push"  # split so shell guards don't flag this file's own command line
CASES = [  # (command, should_block)
    (f"{PUSH} origin main", True),
    (f"{PUSH} -u origin wo/001-x", False),
    ("npx wrangler deploy", True),
    ("npx wrangler deploy --dry-run", False),
    ("gh pr merge 3 --squash", True),
    (f"{PUSH} --for" + "ce origin wo/x", True),
    ("git add -A private/notes.md", True),
    ("git commit --am" + "end -m x", True),
    ("npm run gates", False),
]

bad = 0
for cmd, block in CASES:
    r = subprocess.run(
        [sys.executable, str(GUARD)],
        input=json.dumps({"tool_name": "Bash", "tool_input": {"command": cmd}}),
        capture_output=True,
        text=True,
        cwd="/tmp",  # outside the repo, so the "on main" branch check doesn't apply
    )
    blocked = r.returncode == 2
    ok = blocked == block
    bad += not ok
    print(f"{'✓' if ok else '✗'} {'BLOCK' if blocked else 'allow'}  {cmd}")
sys.exit(1 if bad else 0)
