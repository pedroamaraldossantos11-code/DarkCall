@echo off
REM DarkCall — Build script for Windows .exe
REM Requires: Python 3.x installed and in PATH

echo.
echo   DarkCall Builder (Windows)
echo   ==========================
echo.

REM Create venv if missing
if not exist venv (
    echo [0/4] Creating virtual environment...
    python -m venv venv
)

call venv\Scripts\activate.bat

REM Install dependencies
echo [1/4] Installing dependencies...
pip install -r requirements.txt --quiet --upgrade
pip install pyinstaller --quiet --upgrade

REM Clean
echo [2/4] Cleaning old builds...
if exist dist rmdir /s /q dist
if exist build rmdir /s /q build

REM Build
echo [3/4] Building executable...
pyinstaller ^
    --onefile ^
    --name darkcall ^
    --add-data "static;static" ^
    --noconfirm ^
    --clean ^
    --hidden-import uvicorn.logging ^
    --hidden-import uvicorn.loops ^
    --hidden-import uvicorn.loops.auto ^
    --hidden-import uvicorn.protocols ^
    --hidden-import uvicorn.protocols.http ^
    --hidden-import uvicorn.protocols.http.auto ^
    --hidden-import uvicorn.protocols.websockets ^
    --hidden-import uvicorn.protocols.websockets.auto ^
    --hidden-import uvicorn.lifespan ^
    --hidden-import uvicorn.lifespan.on ^
    --hidden-import fastapi ^
    --hidden-import starlette ^
    server.py

echo [4/4] Build complete!
echo.
echo   Executable: dist\darkcall.exe
echo.
echo   Run: dist\darkcall.exe
echo.

pause
