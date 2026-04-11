#!/bin/bash
# GUI test script for gtd-timer-app using xdotool + scrot
# Usage: ./scripts/test-gui.sh

set -e

export DISPLAY=:0
export LIBGL_ALWAYS_SOFTWARE=1
export WEBKIT_DISABLE_COMPOSITING_MODE=1

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SCREENSHOTS_DIR="$REPO_DIR/scripts/screenshots"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
SHOT_DIR="$SCREENSHOTS_DIR/$TIMESTAMP"
mkdir -p "$SHOT_DIR"

source ~/.cargo/env 2>/dev/null || true

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[TEST]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
fail() { echo -e "${RED}[FAIL]${NC} $1"; }

screenshot() {
  local name="$1"
  local path="$SHOT_DIR/${name}.png"
  sleep 0.5  # brief settle
  DISPLAY=:0 scrot "$path" 2>/dev/null || warn "scrot failed for $name"
  echo "$path"
}

get_window_id() {
  DISPLAY=:0 xdotool search --name "GTD Timer" 2>/dev/null | tail -1
}

wait_for_window() {
  local max_wait=20
  local elapsed=0
  while [ $elapsed -lt $max_wait ]; do
    local wid=$(get_window_id)
    if [ -n "$wid" ]; then
      echo "$wid"
      return 0
    fi
    sleep 0.5
    elapsed=$((elapsed + 1))
  done
  return 1
}

click_window_center() {
  local wid="$1"
  local geo
  geo=$(DISPLAY=:0 xdotool getwindowgeometry "$wid" 2>/dev/null)
  local x y w h
  x=$(echo "$geo" | grep "Position" | awk '{print $2}' | cut -d',' -f1)
  y=$(echo "$geo" | grep "Position" | awk '{print $2}' | cut -d',' -f2)
  w=$(echo "$geo" | grep "Geometry" | awk '{print $2}' | cut -d'x' -f1)
  h=$(echo "$geo" | grep "Geometry" | awk '{print $2}' | cut -d'x' -f2)
  local cx=$(( x + w/2 ))
  local cy=$(( y + h/2 + 40 ))  # slightly below center (timer circle area)
  DISPLAY=:0 xdotool mousemove "$cx" "$cy"
  DISPLAY=:0 xdotool click 1
  echo "$cx $cy"
}

# ─── TEST START ───────────────────────────────────────────────

log "Starting gtd-timer-app..."

# Kill any existing instance
pkill -f "target/debug/app" 2>/dev/null || true
sleep 0.5

# Start app in background
cd "$REPO_DIR"
npx tauri dev > "$SHOT_DIR/app.log" 2>&1 &
APP_PID=$!

log "Waiting for window to appear (up to 60s)..."
WID=""
max=60; elapsed=0
while [ $elapsed -lt $max ]; do
  WID=$(get_window_id)
  if [ -n "$WID" ]; then break; fi
  sleep 1; elapsed=$((elapsed+1))
done

if [ -z "$WID" ]; then
  fail "Window did not appear within ${max}s"
  kill $APP_PID 2>/dev/null
  exit 1
fi

log "Window found: $WID"
DISPLAY=:0 xdotool windowfocus "$WID" 2>/dev/null || true
sleep 1

# ── Step 1: Initial state ──────────────────────────────────────
log "Step 1: Capturing initial state..."
S1=$(screenshot "01_initial")
log "  → $S1"

# ── Step 2: Click to start timer ──────────────────────────────
log "Step 2: Clicking to start timer..."
click_window_center "$WID"
sleep 0.3
S2=$(screenshot "02_running")
log "  → $S2"

# ── Step 3: Wait 3s, capture countdown ────────────────────────
log "Step 3: Waiting 3s to see countdown..."
sleep 3
S3=$(screenshot "03_countdown_3s")
log "  → $S3"

# ── Step 4: Click to pause ─────────────────────────────────────
log "Step 4: Pausing timer..."
click_window_center "$WID"
sleep 0.3
S4=$(screenshot "04_paused")
log "  → $S4"

# ── Step 5: Double-click to open duration input ────────────────
log "Step 5: Double-clicking to open duration input..."
geo=$(DISPLAY=:0 xdotool getwindowgeometry "$WID" 2>/dev/null)
x=$(echo "$geo" | grep "Position" | awk '{print $2}' | cut -d',' -f1)
y=$(echo "$geo" | grep "Position" | awk '{print $2}' | cut -d',' -f2)
w=$(echo "$geo" | grep "Geometry" | awk '{print $2}' | cut -d'x' -f1)
h=$(echo "$geo" | grep "Geometry" | awk '{print $2}' | cut -d'x' -f2)
# digital timer is roughly bottom-center of window
tx=$(( x + w/2 ))
ty=$(( y + h*3/4 ))
DISPLAY=:0 xdotool mousemove "$tx" "$ty"
DISPLAY=:0 xdotool click --repeat 2 --delay 150 1
sleep 0.5
S5=$(screenshot "05_duration_input_open")
log "  → $S5"

# ── Step 6: Type new duration (5 minutes) and confirm ─────────
log "Step 6: Typing '5' and pressing Enter..."
DISPLAY=:0 xdotool key ctrl+a
DISPLAY=:0 xdotool type "5"
sleep 0.2
DISPLAY=:0 xdotool key Return
sleep 0.5
S6=$(screenshot "06_duration_set_5min")
log "  → $S6"

# ── Step 7: Space to start, wait, screenshot ──────────────────
log "Step 7: Starting timer with Space key..."
DISPLAY=:0 xdotool windowfocus "$WID"
DISPLAY=:0 xdotool key space
sleep 2
S7=$(screenshot "07_5min_running")
log "  → $S7"

# ── Cleanup ───────────────────────────────────────────────────
log "Killing app..."
kill $APP_PID 2>/dev/null || true
pkill -f "target/debug/app" 2>/dev/null || true

echo ""
log "All screenshots saved to: $SHOT_DIR"
log "Screenshots:"
ls "$SHOT_DIR"/*.png 2>/dev/null | while read f; do echo "  $f"; done
echo ""
log "Test complete. Review screenshots above."
