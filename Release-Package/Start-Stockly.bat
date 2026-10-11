@echo off
title Stockly Retail & Inventory Suite
echo Starting Stockly...
if exist "win-unpacked\Stockly.exe" (
    start "" "win-unpacked\Stockly.exe"
) else if exist "Stockly.exe" (
    start "" "Stockly.exe"
) else (
    echo Please run Stockly-Setup.exe to install.
    pause
)
