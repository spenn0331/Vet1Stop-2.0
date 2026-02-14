@echo off
echo Vet1Stop MongoDB Standardization Process
echo =======================================
echo.

rem Set timestamp for backup files
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "timestamp=%dt:~0,8%-%dt:~8,6%"

echo Step 1: Creating backups (timestamp: %timestamp%)
echo ------------------------------------------------

rem Create backup directory
if not exist "backups\%timestamp%" mkdir "backups\%timestamp%"

rem Use MongoDB connection string from .env file
for /F "tokens=*" %%a in ('type ..\.env ^| findstr MONGODB_URI') do set %%a

echo Using connection string from .env file

echo Creating backups of collections...
mongoexport --uri="%MONGODB_URI%" --collection=resources --db=test --out=backups\%timestamp%\resources.json
mongoexport --uri="%MONGODB_URI%" --collection=healthResources --db=test --out=backups\%timestamp%\healthResources.json
mongoexport --uri="%MONGODB_URI%" --collection=educationResources --db=test --out=backups\%timestamp%\educationResources.json
mongoexport --uri="%MONGODB_URI%" --collection=lifeLeisureResources --db=test --out=backups\%timestamp%\lifeLeisureResources.json

echo.
echo Step 2: Running standardization script
echo -------------------------------------
echo.
echo This process will standardize all resources in the MongoDB database.
echo It will ensure consistent field names and data structures across all resource types.
echo.
echo Press any key to continue or CTRL+C to cancel...
pause > nul

node standardize-resources.js

echo.
echo Process completed.
echo Backups are stored in backups\%timestamp%\
echo.
echo IMPORTANT: If you need to restore from backups, use:
echo mongoimport --uri="YOUR_CONNECTION_STRING" --collection=resources --db=test --file=backups\%timestamp%\resources.json
echo.

rem Automatically update Git repository
echo Updating Git repository with changes...
cd ..
git add .
git commit -m "MongoDB data standardization - %timestamp%"

echo Process complete!
echo.
pause
