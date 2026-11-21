#!/usr/bin/env bash
# Run one work order through the factory:
#   intake (spec lint) → build (builder agent, own worktree) → gates → review (fresh agent) → PR
#
#   factory/stations/run-wo.sh WO-012            full run, opens a PR
#   factory/stations/run-wo.sh WO-012 --no-pr    stop after review
#
# Agents never merge or deploy (constitution art. 9). Human-gated WOs get the `owner-gate` label.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
WO=${1:?usage: run-wo.sh WO-### [--no-pr]}
NO_PR=0; [[ "${2:-}" == "--no-pr" ]] && NO_PR=1

SPEC=$(ls "$ROOT"/factory/specs/"$WO"-*.md 2>/dev/null | head -1)
[[ -f "$SPEC" ]] || { echo "no spec for $WO"; exit 1; }
SLUG=$(basename "$SPEC" .md | tr '[:upper:]' '[:lower:]')
BRANCH="wo/$SLUG"
TREE="$ROOT/../portfolio-worktrees/$SLUG"
LOG="$ROOT/factory/log/$WO.json"
GATE=$(sed -n 's/^gate:[[:space:]]*\([a-z]*\).*/\1/p' "$SPEC" | head -1)
TITLE=$(sed -n 's/^title:[[:space:]]*//p' "$SPEC" | head -1)

echo "▶ intake: $WO — $TITLE (gate: $GATE)"
node "$ROOT/factory/stations/speclint.mjs" "$SPEC"

echo "▶ build: worktree $TREE on $BRANCH"
git -C "$ROOT" worktree add -B "$BRANCH" "$TREE" main 2>/dev/null || git -C "$ROOT" worktree add "$TREE" "$BRANCH"
cp -R "$ROOT/node_modules" "$TREE/" 2>/dev/null || (cd "$TREE" && npm ci)
[[ -d "$ROOT/private" ]] && ln -sfn "$ROOT/private" "$TREE/private"   # banned terms for the anonymize hook
cd "$TREE"

started=$(date +%s)
claude -p "Implement work order $WO. Spec file: factory/specs/$(basename "$SPEC"). Follow your agent instructions." \
  --agent builder \
  --append-system-prompt "$(cat factory/constitution.md)" \
  --permission-mode acceptEdits \
  --output-format json > "$LOG.build" || true

echo "▶ gates (authoritative re-run)"
if npm run -s gates > "factory/out/$WO-gates.txt" 2>&1; then GATES=pass; else GATES=fail; fi
tail -20 "factory/out/$WO-gates.txt"

echo "▶ review (fresh context)"
claude -p "Review work order $WO on this branch." --agent reviewer --output-format json > "$LOG.review" || true
VERDICT=$(grep -o 'VERDICT: [A-Z]*' "$LOG.review" | tail -1 || echo "VERDICT: UNKNOWN")

node -e '
  const [log, wo, gates, verdict, secs] = process.argv.slice(1);
  require("fs").writeFileSync(log, JSON.stringify({ wo, gates, verdict, seconds: +secs, at: new Date().toISOString() }, null, 2));
' "$ROOT/factory/log/$WO.json" "$WO" "$GATES" "$VERDICT" "$(( $(date +%s) - started ))"
cp "$ROOT/factory/log/$WO.json" "factory/log/$WO.json"
echo "▶ $WO: gates=$GATES, $VERDICT"

if [[ $GATES != pass || $VERDICT != "VERDICT: PASS" ]]; then
  echo "✗ escalate to owner: see factory/out/$WO-gates.txt and $LOG.review"; exit 1
fi
[[ $NO_PR == 1 ]] && exit 0

git add -A && git commit -qm "$WO: $TITLE" && git push -u origin "$BRANCH"
LABEL=""; [[ $GATE == human ]] && LABEL="--label owner-gate"
gh pr create --base main --head "$BRANCH" --title "$WO: $TITLE" $LABEL \
  --body "Work order: \`factory/specs/$(basename "$SPEC")\`

Gates: $GATES · Review: $VERDICT · Gate type: **$GATE**

$( [[ $GATE == human ]] && echo '⚠️ Owner sign-off required — agents must not merge this PR.')"
