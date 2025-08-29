@echo off
title Vet1Stop - Ultimate Clean Commit System
color 0c

echo.
echo ==========================================
echo  VET1STOP - ULTIMATE CLEAN COMMIT SYSTEM
echo ==========================================
echo  WARNING: This will create a clean branch
echo  and replace the main branch history
echo ==========================================
echo.
echo This system will:
echo   1. Create a clean branch without large files
echo   2. Keep only essential project files
echo   3. Replace main branch with clean version
echo   4. Resolve GitHub large file issues permanently
echo.
echo Press any key to continue or Ctrl+C to cancel...
pause >nul

echo.
echo Starting ultimate clean commit process...
echo.

powershell -ExecutionPolicy Bypass -File "ULTIMATE-CLEAN-COMMIT.ps1"

echo.
echo ==========================================
echo  ULTIMATE CLEAN COMMIT COMPLETED
echo ==========================================
echo.
echo Press any key to exit...
pause >nul
