@echo off
echo Running Git Update Script for Vet1Stop...
echo.

echo Adding all changes to staging...
git add .

echo.
echo Committing changes...
set /p commit_message="Enter commit message (or press Enter for default message): "

if "%commit_message%"=="" (
    set commit_message="Automatic update %date% %time%"
)

git commit -m %commit_message%

echo.
echo Pushing to GitHub repository...
git push -u origin master

echo.
echo Git update completed!
pause
