#!/usr/bin/env python3
"""Claude Code PreToolUse hook for the portfolio factory (constitution art. 9).

ASK   — shipping actions need the owner's confirmation each time: pushes to main, PR merges,
        production deploys. The hook returns permissionDecision "ask", so Claude Code shows the
        owner an approval prompt even in permissive modes. One approval covers one command.
BLOCK — never allowed: force/mirror/delete pushes, history rewrites, branch-protection or
        ruleset changes, committing private/.

Exit 2 + stderr = block. Exit 0 + JSON on stdout = ask. Exit 0 and no output = no opinion.
On its own errors it exits 0 so a bug here can't wedge a session.
"""

import json
import re
import subprocess
import sys

SEG = r"[^|;&]*"  # stay within one shell command segment

BLOCK = [
    (rf"\bgit\s+push\b{SEG}\s(--force|-f\b|--force-with-lease|--mirror|--delete|-d\b)",
     "force/mirror/delete pushes are not allowed"),
    (r"\bgit\s+(filter-branch|filter-repo|rebase\s+-i|commit\s+--amend)\b",
     "history rewrites are not allowed"),
    (rf"\bgh\s+api\b{SEG}(branches/[^ ]*/protection|/rulesets)",
     "branch protection and rulesets are owner-only"),
    (rf"\bgit\s+add\b{SEG}\bprivate\b", "private/ is never committed (art. 8)"),
]

ASK = [
    (rf"\bwrangler\b{SEG}\b(deploy|versions\s+deploy|rollback)\b(?!{SEG}--dry-run)",
     "production deploy"),
    (rf"\bgit\s+push\b{SEG}\b(main|master)\b", "push to main"),
    (r"\bgh\s+pr\s+merge\b", "PR merge into main (deploys production)"),
    (rf"\bgh\s+api\b{SEG}/merges?\b", "merge via the GitHub API"),
]


def current_branch() -> str:
    try:
        return subprocess.run(["git", "branch", "--show-current"], capture_output=True,
                              text=True, timeout=5).stdout.strip()
    except Exception:
        return ""


def ask(what: str) -> int:
    print(json.dumps({"hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": "ask",
        "permissionDecisionReason": f"Constitution art. 9: {what} needs the owner's confirmation.",
    }}))
    return 0


def main() -> int:
    try:
        event = json.load(sys.stdin)
    except ValueError:
        return 0
    if event.get("tool_name") != "Bash":
        return 0
    cmd = (event.get("tool_input") or {}).get("command") or ""

    for pattern, why in BLOCK:
        if re.search(pattern, cmd):
            print(f"portfolio_guard: blocked — {why}.", file=sys.stderr)
            return 2

    for pattern, what in ASK:
        if re.search(pattern, cmd):
            return ask(what)

    # A bare `git push` while on main is also a push to main.
    if re.search(r"\bgit\s+push\b", cmd) and current_branch() in ("main", "master"):
        return ask("push to main")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception:
        sys.exit(0)
