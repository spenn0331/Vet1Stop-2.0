@echo off
title Vet1Stop - Safe Automated Git Operations
color 0b

echo.
echo ==========================================
echo  VET1STOP - SAFE AUTOMATED COMMIT & PUSH
echo ==========================================
echo  Using SSH Authentication (Secure)
echo  NO LARGE FILES - SAFE FOR GITHUB
echo ==========================================
echo.
echo Starting safe automated git operations...
echo Only essential files will be committed!
echo.

powershell -ExecutionPolicy Bypass -File "AUTOMATED-COMMIT-PUSH-SAFE.ps1"

echo.
echo ==========================================
echo  SAFE AUTOMATION COMPLETED
echo ==========================================
echo.
echo Press any key to exit...
pause >nul
