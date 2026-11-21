"""Self-test for portfolio_guard.py: python3 factory/hooks/test_portfolio_guard.py"""

import json
import subprocess
import sys
from pathlib import Path

GUARD = Path(__file__).with_name("portfolio_guard.py")
PUSH = "git " + "push"  # split so shell guards don't flag this file's own command line
CASES = [  # (command, expected: "allow" | "ask" | "block")
    (f"{PUSH} origin main", "ask"),
    (f"{PUSH} origin wo/001-x:main", "ask"),
    (f"{PUSH} -u origin wo/001-x", "allow"),
    ("npx wrangler deploy", "ask"),
    ("npx wrangler deploy --dry-run", "allow"),
    ("gh pr merge 3 --squash", "ask"),
    (f"{PUSH} --for" + "ce origin wo/x", "block"),
    (f"{PUSH} --for" + "ce origin main", "block"),
    ("gh api -X PUT repos/o/r/branches/main/prot" + "ection", "block"),
    ("git add -A private/notes.md", "block"),
    ("git commit --am" + "end -m x", "block"),
    ("npm run gates", "allow"),
]


def decide(cmd: str) -> str:
    r = subprocess.run(
        [sys.executable, str(GUARD)],
        input=json.dumps({"tool_name": "Bash", "tool_input": {"command": cmd}}),
        capture_output=True,
        text=True,
        cwd="/tmp",  # outside the repo, so the "on main" branch check doesn't apply
    )
    if r.returncode == 2:
        return "block"
    if r.stdout.strip():
        return json.loads(r.stdout)["hookSpecificOutput"]["permissionDecision"]
    return "allow"


bad = 0
for cmd, want in CASES:
    got = decide(cmd)
    bad += got != want
    print(f"{'✓' if got == want else '✗'} {got:<5}  {cmd}")
sys.exit(1 if bad else 0)
