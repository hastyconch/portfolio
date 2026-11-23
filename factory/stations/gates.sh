#!/usr/bin/env bash
# The factory's automated gates (station 3). Same steps run in CI (.github/workflows/gates.yml).
#   npm run gates            all gates
#   npm run gates -- --quick skip Lighthouse (for inner build loops)
set -uo pipefail
cd "$(dirname "$0")/../.."

QUICK=0; [[ "${1:-}" == "--quick" ]] && QUICK=1
mkdir -p factory/out
results=()
failed=0

gate() { # gate <name> <command...>
  local name=$1; shift
  printf '\n━━ %s ━━\n' "$name"
  if "$@"; then results+=("✓ $name"); else results+=("✗ $name"); failed=1; fi
}

gate "spec lint"      npm run -s speclint
gate "types"          npm run -s check
gate "lint"           npx eslint .
gate "format"         npx prettier --check . --log-level warn
gate "build"          npx astro build --silent
gate "anonymize"      npm run -s anonymize
gate "copy (art. 11)" npm run -s copylint
gate "copy tells"     npm run -s tastelint
gate "craft (art. 12)" npm run -s craft
gate "private leak"   bash -c '! grep -rIl --include="*" -e "private/" dist/ 2>/dev/null | grep -q .'
gate "internal links" npm run -s links
gate "resume pdf"     npm run -s resume:check
gate "e2e+a11y+shots" npx playwright test
if [[ $QUICK == 0 ]]; then
  gate "lighthouse"   npx lhci autorun --config=lighthouserc.cjs
fi
if command -v gitleaks >/dev/null; then
  gate "secrets"      gitleaks detect --no-banner --redact -v
else
  results+=("- secrets (gitleaks not installed locally; runs in CI)")
fi

printf '\n━━ summary ━━\n'; printf '%s\n' "${results[@]}"
exit $failed
