@echo off

echo %cd%

start chrome.exe --disable-web-security --user-data-dir=C:\ProgramData\tempChrome --kiosk %cd%\html\index.html