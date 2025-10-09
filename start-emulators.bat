@echo off
cd /d "c:\Users\praja\Desktop\Timeout-DEMO\Timeout Backend"
set JAVA_HOME=C:\Users\praja\Downloads\openjdk-24.0.2_windows-x64_bin\jdk-24.0.2
set PATH=%JAVA_HOME%\bin;%PATH%
echo Starting Firebase emulators...
firebase emulators:start