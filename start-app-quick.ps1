# Script rápido para ejecutar la aplicación (asume que todo está configurado)
# Usa este script después de haber ejecutado start-app.ps1 por primera vez

$ErrorActionPreference = "Stop"

Write-Host "Iniciando aplicación..." -ForegroundColor Cyan

if (-not (Test-Path ".env")) {
    Write-Host "ERROR: Archivo .env no encontrado." -ForegroundColor Red
    Write-Host "Ejecuta primero: .\start-app.ps1" -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path "dist")) {
    Write-Host "Compilando aplicación..." -ForegroundColor Yellow
    yarn run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Falló la compilación." -ForegroundColor Red
        exit 1
    }
}

Write-Host "Iniciando servidor..." -ForegroundColor Green
yarn run start:prod

