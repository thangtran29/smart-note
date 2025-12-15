@echo off
REM Batch script to load .env and run dev server for Windows CMD

REM Check if .env file exists
if not exist .env (
    echo Warning: .env file not found
    goto :run
)

REM Load environment variables from .env file
for /f "usebackq tokens=1* delims==" %%a in (".env") do (
    set "line=%%a"
    if not "!line:~0,1!"=="#" (
        set "%%a"
    )
)

echo Loaded environment variables from .env

:run
REM Run Next.js dev server
call npm run dev

