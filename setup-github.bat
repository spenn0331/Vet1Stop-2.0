@echo off
echo Setting up GitHub connection for Vet1Stop...
echo.

echo Adding GitHub remote repository...
git remote add origin https://github.com/spenn0331/Vet1Stop-2.0.git

echo.
echo Configuring credential helper to store credentials...
git config credential.helper store

echo.
echo Ready to push to GitHub!
echo You will be prompted for your GitHub username and password/token.
echo Note: For password, use a personal access token if you have 2FA enabled.
echo.
echo After this setup completes, you can use git-update.bat for regular updates.
echo.

pause

echo Attempting initial push to GitHub...
git push -u origin master

echo.
echo Setup completed!
echo If successful, your code is now on GitHub.
echo If you encountered errors, please check your credentials and try again.
echo.

pause
