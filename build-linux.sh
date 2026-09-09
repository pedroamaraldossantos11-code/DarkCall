#!/usr/bin/env bash
# DarkCall — Build script for Linux executable + AppImage
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
DIST_DIR="$PROJECT_DIR/dist"
BUILD_DIR="$PROJECT_DIR/build"
VENV_DIR="$PROJECT_DIR/venv"
APP_NAME="DarkCall"
EXECUTABLE="darkcall"

echo ""
echo "  DarkCall Builder"
echo "  ================="
echo ""

# ── Create venv if missing ────────────────────────────────
if [ ! -d "$VENV_DIR" ]; then
    echo "[0/5] Creating virtual environment..."
    python3 -m venv "$VENV_DIR"
fi

source "$VENV_DIR/bin/activate"

# ── Install dependencies ──────────────────────────────────
echo "[1/5] Installing dependencies..."
pip install -r "$PROJECT_DIR/requirements.txt" --quiet --upgrade
pip install pyinstaller --quiet --upgrade

# ── Clean old builds ──────────────────────────────────────
echo "[2/5] Cleaning old builds..."
rm -rf "$BUILD_DIR" "$DIST_DIR"
mkdir -p "$DIST_DIR"

# ── Build executable ──────────────────────────────────────
echo "[3/5] Building executable..."
pyinstaller \
    --onefile \
    --name "$EXECUTABLE" \
    --add-data "static:static" \
    --noconfirm \
    --clean \
    --hidden-import uvicorn.logging \
    --hidden-import uvicorn.loops \
    --hidden-import uvicorn.loops.auto \
    --hidden-import uvicorn.protocols \
    --hidden-import uvicorn.protocols.http \
    --hidden-import uvicorn.protocols.http.auto \
    --hidden-import uvicorn.protocols.websockets \
    --hidden-import uvicorn.protocols.websockets.auto \
    --hidden-import uvicorn.lifespan \
    --hidden-import uvicorn.lifespan.on \
    --hidden-import fastapi \
    --hidden-import starlette \
    "$PROJECT_DIR/server.py"

echo "    -> Executable: $DIST_DIR/$EXECUTABLE"

# ── Create AppDir structure ───────────────────────────────
echo "[4/5] Creating AppImage..."

APPDIR="$BUILD_DIR/$APP_NAME.AppDir"
mkdir -p "$APPDIR/usr/bin"
mkdir -p "$APPDIR/usr/share/icons/hicolor/256x256/apps"
mkdir -p "$APPDIR/usr/share/applications"

cp "$DIST_DIR/$EXECUTABLE" "$APPDIR/usr/bin/$EXECUTABLE"

cat > "$APPDIR/$APP_NAME.desktop" << 'EOF'
[Desktop Entry]
Type=Application
Name=DarkCall
Comment=Real-time video rooms and chat
Exec=darkcall
Icon=darkcall
Terminal=true
Categories=Network;
EOF

cat > "$APPDIR/usr/share/icons/hicolor/256x256/apps/darkcall.svg" << 'SVGEOF'
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#247cff"/>
      <stop offset="100%" style="stop-color:#145dcc"/>
    </linearGradient>
  </defs>
  <rect width="256" height="256" rx="48" fill="url(#bg)"/>
  <text x="128" y="170" font-family="Arial,sans-serif" font-size="140" font-weight="900" fill="white" text-anchor="middle">D</text>
</svg>
SVGEOF

cp "$APPDIR/usr/share/icons/hicolor/256x256/apps/darkcall.svg" "$APPDIR/darkcall.svg"
ln -sf "usr/bin/$EXECUTABLE" "$APPDIR/$EXECUTABLE"

# ── Build AppImage ────────────────────────────────────────
ARCH="$(uname -m)"
OUTPUT="$DIST_DIR/DarkCall-${ARCH}.AppImage"
APPIMAGE_TOOL="$BUILD_DIR/appimagetool"

if [ ! -f "$APPIMAGE_TOOL" ]; then
    echo "    Downloading appimagetool..."
    curl -L -o "$APPIMAGE_TOOL" \
        "https://github.com/AppImage/appimagetool/releases/download/continuous/appimagetool-${ARCH}.AppImage" 2>/dev/null
    chmod +x "$APPIMAGE_TOOL"
fi

ARCH="$ARCH" "$APPIMAGE_TOOL" "$APPDIR" "$OUTPUT" --no-appstream 2>/dev/null || {
    echo "    AppImage creation failed. Use the executable directly:"
    echo "    $DIST_DIR/$EXECUTABLE"
    exit 0
}

echo "    -> AppImage: $OUTPUT"

# ── Done ──────────────────────────────────────────────────
echo "[5/5] Build complete!"
echo ""
echo "  Executable : $DIST_DIR/$EXECUTABLE"
echo "  AppImage   : $OUTPUT"
echo ""
echo "  Run: ./dist/$EXECUTABLE"
echo ""
