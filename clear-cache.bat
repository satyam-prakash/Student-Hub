@echo off
echo Clearing Vite cache and build artifacts...

REM Remove Vite cache
if exist "node_modules\.vite" (
    echo Removing node_modules\.vite...
    rmdir /s /q "node_modules\.vite"
)

REM Remove dist folder
if exist "dist" (
    echo Removing dist...
    rmdir /s /q "dist"
)

echo Cache cleared successfully!
echo.
echo Now run: npm run dev
pause
