#!/usr/bin/env bash
# DarkCall — Run in development mode
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
VENV_DIR="$PROJECT_DIR/venv"

if [ ! -d "$VENV_DIR" ]; then
    echo "Creating virtual environment..."
    python3 -m venv "$VENV_DIR"
fi

source "$VENV_DIR/bin/activate"
pip install -r "$PROJECT_DIR/requirements.txt" --quiet 2>/dev/null

echo ""
echo "  Starting DarkCall server..."
echo "  http://localhost:8765"
echo ""

python "$PROJECT_DIR/server.py"
