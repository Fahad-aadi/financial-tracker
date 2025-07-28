@echo off
echo Starting Financial Tracker Server...

:: Verify and initialize database
echo Verifying database...
node server/database.js

:: Start the server
echo Starting server...
node server/start-server-debug.js
