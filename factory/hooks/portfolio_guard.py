#!/usr/bin/env python3
"""Claude Code PreToolUse hook for the portfolio factory (constitution art. 9).

Blocks agents from shipping: production deploys, pushes to main, force pushes, history
rewrites, and PR merges. The owner runs those commands themselves.

Exit 2 + stderr = block and tell Claude why. Exit 0 = no opinion (normal permission flow).
On its own errors it exits 0 so a bug here can't wedge a session; CI branch protection is the
backstop.
"""

import json
import re
import subprocess
import sys

RULES = [
    (r"\bwrangler\b[^|;&]*\b(deploy|versions\s+deploy|rollback)\b(?![^|;&]*--dry-run)",
     "production deploys happen by merging to main (Workers Builds), never from an agent"),
    (r"\bgit\s+push\b[^|;&]*\s(--force|-f\b|--force-with-lease|--mirror|--delete|-d\b)",
     "force/mirror/delete pushes are not allowed"),
    (r"\bgit\s+push\b[^|;&]*\b(main|master)\b",
     "agents never push to main; open a PR from a wo/* branch"),
    (r"\bgh\s+pr\s+merge\b", "agents never merge PRs; the owner merges"),
    (r"\bgh\s+api\b[^|;&]*\b(merge|branches/[^ ]*/protection)\b",
     "merges and branch-protection changes are owner-only"),
    (r"\bgit\s+(filter-branch|filter-repo|rebase\s+-i|commit\s+--amend)\b",
     "history rewrites are not allowed"),
    (r"\bgit\s+add\b[^|;&]*\bprivate\b", "private/ is never committed (art. 8)"),
]


def current_branch() -> str:
    try:
        return subprocess.run(["git", "branch", "--show-current"], capture_output=True,
                              text=True, timeout=5).stdout.strip()
    except Exception:
        return ""


def main() -> int:
    try:
        event = json.load(sys.stdin)
    except ValueError:
        return 0
    if event.get("tool_name") != "Bash":
        return 0
    cmd = (event.get("tool_input") or {}).get("command") or ""

    for pattern, why in RULES:
        if re.search(pattern, cmd):
            print(f"portfolio_guard: blocked — {why}. Ask the owner to run it.", file=sys.stderr)
            return 2

    # A bare `git push` while on main is also a push to main.
    if re.search(r"\bgit\s+push\b", cmd) and current_branch() in ("main", "master"):
        print("portfolio_guard: blocked — you are on main; agents push wo/* branches only.",
              file=sys.stderr)
        return 2
    if re.search(r"\bgit\s+commit\b", cmd) and current_branch() in ("main", "master"):
        print("portfolio_guard: blocked — don't commit on main; create a wo/* branch first.",
              file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception:
        sys.exit(0)
