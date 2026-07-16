#!/bin/bash
# UniSkill Notify Daemon — polls Gateway for pending notifications and displays them
# Usage: bash notify-daemon.sh
# Runs in background, checks every 2 seconds

GATEWAY="${UNISKILL_GATEWAY_URL:-https://api.uniskill.ai}"
USER_UID="${UNISKILL_USER_UID:-}"

if [ -z "$USER_UID" ]; then
  echo "[UniSkill Notify] Set UNISKILL_USER_UID env var to your user UID"
  exit 1
fi

echo "[UniSkill Notify] Daemon started. Polling ${GATEWAY} for user ${USER_UID:0:8}..."
echo "[UniSkill Notify] Leave this terminal running. Ctrl+C to stop."

while true; do
  RESP=$(curl -s -f "${GATEWAY}/v1/notify/poll?user_uid=${USER_UID}" 2>/dev/null)
  if [ $? -eq 0 ] && [ -n "$RESP" ]; then
    TITLE=$(echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('title','UniSkill'))" 2>/dev/null)
    BODY=$(echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('body',''))" 2>/dev/null)

    if [ "$(uname)" = "Darwin" ]; then
      # macOS — native notification center
      osascript -e "display notification \"${BODY//\"/\\\"}\" with title \"${TITLE//\"/\\\"}\" sound name \"Glass\""
    elif command -v notify-send &>/dev/null; then
      # Linux
      notify-send "$TITLE" "$BODY"
    fi
  fi
  sleep 2
done
