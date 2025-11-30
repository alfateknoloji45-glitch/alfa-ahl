@echo off
echo ========================================
echo    ALFAI Enterprise ERP - Windows
echo ========================================
echo.

echo Node.js kontrolu...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo HATA: Node.js bulunamadi!
    echo Lutfen Node.js yukleyin: https://nodejs.org
    pause
    exit /b 1
)

echo Node.js versiyonu:
node -v
echo.

echo Hangi servisi baslatmak istersiniz?
echo.
echo 1. Backend
echo 2. Frontend
echo 3. Her ikisi de (2 terminal gerekir)
echo.
set /p choice="Seciminiz (1-3): "

if "%choice%"=="1" goto backend
if "%choice%"=="2" goto frontend
if "%choice%"=="3" goto both
echo Gecersiz secim!
pause
exit /b 1

:backend
echo.
echo Backend baslatiliyor...
cd backend
if not exist "node_modules" (
    echo Dependencies yukleniyor...
    call npm install
)
if not exist ".env" (
    echo .env dosyasi olusturuluyor...
    copy .env.example .env
)
echo.
echo Backend http://localhost:5002 adresinde baslatildi
echo.
call npm start
goto end

:frontend
echo.
echo Frontend baslatiliyor...
cd frontend
if not exist "node_modules" (
    echo Dependencies yukleniyor...
    call npm install
)
if not exist ".env" (
    echo .env dosyasi olusturuluyor...
    copy .env.example .env
)
echo.
echo Frontend http://localhost:5173 adresinde baslatildi
echo.
call npm run dev
goto end

:both
echo.
echo UYARI: Backend ve Frontend'i ayri terminallerde baslatmaniz gerekiyor!
echo.
echo 1. Bu terminal: Backend baslatilacak
echo 2. Yeni terminal acin ve "start-windows.bat" i tekrar calistirin
echo 3. Yeni terminalde "2" secerek Frontend'i baslatın
echo.
pause
goto backend

:end
pause
