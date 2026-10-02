#!/usr/bin/env bash
# PrintooNeon server-side deploy script.
# Runs ON THE SERVER as root. Strictly additive:
#   - app files in /opt/printoo (fresh directory)
#   - bun installed under /root/.bun (no system packages)
#   - one NEW systemd unit: printoo.service
#   - if ufw is active, allow the app port (new rule only)
# It never stops, edits, or restarts any other service.
set -euo pipefail

PORT="${1:-3000}"
APP=/opt/printoo
export HOME="${HOME:-/root}"

echo "== server info =="
uname -m; free -m | head -2; df -h / | tail -1

# --- 1. bun runtime (user-space install, no apt) --------------------------
if [ ! -x "$HOME/.bun/bin/bun" ]; then
  echo "== installing bun =="
  curl -fsSL https://bun.sh/install | bash
fi
export PATH="$HOME/.bun/bin:$PATH"
echo "bun $(bun --version)"

# --- 2. env for Prisma CLI (runtime env comes from systemd) ---------------
mkdir -p "$APP/db"
cat > "$APP/.env" <<EOF
DATABASE_URL=file:$APP/db/custom.db
EOF

# --- 3. dependencies -------------------------------------------------------
cd "$APP"
echo "== bun install =="
bun install --frozen-lockfile || bun install

echo "== prisma generate =="
bunx prisma generate

echo "== prisma db push =="
bunx prisma db push --accept-data-loss

# --- 4. production build ---------------------------------------------------
echo "== next build =="
bun run build

# Safety net: make sure the Prisma client + query engine are inside the
# standalone bundle (Next tracing usually includes them; copy if missing).
if [ -d node_modules/.prisma/client ]; then
  mkdir -p .next/standalone/node_modules/.prisma
  cp -r node_modules/.prisma/client .next/standalone/node_modules/.prisma/
fi
if [ -d node_modules/@prisma/client ]; then
  mkdir -p .next/standalone/node_modules/@prisma
  cp -r node_modules/@prisma/client .next/standalone/node_modules/@prisma/
fi

# --- 5. systemd service ----------------------------------------------------
echo "== systemd unit (printoo.service) =="
cat > /etc/systemd/system/printoo.service <<EOF
[Unit]
Description=PrintooNeon - neon sign designer
After=network.target

[Service]
Type=simple
WorkingDirectory=$APP
Environment=NODE_ENV=production
Environment=PORT=$PORT
Environment=HOSTNAME=0.0.0.0
Environment=DATABASE_URL=file:$APP/db/custom.db
ExecStart=$HOME/.bun/bin/bun $APP/.next/standalone/server.js
Restart=always
RestartSec=3
User=root

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable printoo >/dev/null 2>&1 || true
systemctl restart printoo

# --- 6. firewall (only add a rule, never touch existing ones) -------------
if command -v ufw >/dev/null 2>&1 && ufw status 2>/dev/null | grep -q "Status: active"; then
  echo "== ufw active: allowing tcp/$PORT =="
  ufw allow "$PORT"/tcp || true
fi

# --- 7. verify --------------------------------------------------------------
sleep 2
echo "== service status =="
systemctl is-active printoo && echo "printoo.service is RUNNING"
systemctl --no-pager -n 5 status printoo || true
echo "== local http check =="
curl -s -o /dev/null -w "HTTP %{http_code} @ http://127.0.0.1:$PORT/\n" "http://127.0.0.1:$PORT/"
echo "== listening =="
ss -tlnp | grep ":$PORT " || true
echo "DEPLOY_OK"
