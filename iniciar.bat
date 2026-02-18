@echo off
title Chat Platform - Iniciando...
color 0A
echo.
echo  ===================================================
echo   Chat Platform - Iniciando todos os servicos
echo  ===================================================
echo.

:: Caminhos do Scoop
set REDIS_SERVER=%USERPROFILE%\scoop\apps\redis\current\redis-server.exe
set REDIS_CLI=%USERPROFILE%\scoop\apps\redis\current\redis-cli.exe
set PG_CTL=%USERPROFILE%\scoop\apps\postgresql\current\bin\pg_ctl.exe
set PG_DATA=%USERPROFILE%\scoop\apps\postgresql\current\data

:: Verificar/iniciar Redis
echo [1/3] Verificando Redis...
%REDIS_CLI% ping >nul 2>&1
if %errorlevel% neq 0 (
    echo  Iniciando Redis...
    start "" /B %REDIS_SERVER% --port 6379
    timeout /t 3 /nobreak >nul
)
echo  [OK] Redis rodando na porta 6379!

:: Verificar/iniciar PostgreSQL
echo.
echo [2/3] Verificando PostgreSQL...
%REDIS_CLI% -p 5432 ping >nul 2>&1
netstat -ano | findstr ":5432" | findstr "LISTENING" >nul 2>&1
if %errorlevel% neq 0 (
    echo  Iniciando PostgreSQL...
    %PG_CTL% -D "%PG_DATA%" start -l "%PG_DATA%\postgresql.log"
    timeout /t 5 /nobreak >nul
)
echo  [OK] PostgreSQL rodando na porta 5432!

:: Aguardar banco estar pronto
echo.
echo  Aguardando servicos estabilizarem...
timeout /t 3 /nobreak >nul

:: Iniciar Backend
echo.
echo [3/3] Iniciando Backend e Frontend...
start "Backend - NestJS" cmd /k "cd /d %~dp0apps\backend && pnpm run start:dev"

echo  Aguardando backend inicializar (15 segundos)...
timeout /t 15 /nobreak >nul

start "Frontend - Next.js" cmd /k "cd /d %~dp0apps\frontend && npm run dev"

echo.
echo  ===================================================
echo   Tudo iniciado! Aguarde mais alguns segundos...
echo  ===================================================
echo.
echo   Backend:   http://localhost:3001/api
echo   Frontend:  http://localhost:3000
echo.
echo  Abrindo o navegador em 10 segundos...
timeout /t 10 /nobreak >nul

start "" "http://localhost:3000"

echo.
echo  Pressione qualquer tecla para fechar esta janela.
echo  (Os servidores continuam rodando em segundo plano)
pause >nul
