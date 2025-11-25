# Script de PowerShell para ejecutar la aplicación Cementerio Pillaro
# Optimizado para Windows 10 con 4GB de RAM
# Requiere: Node.js 20.14.0, PostgreSQL, Yarn

param(
    [string]$Port = "3005",
    [string]$DbHost = "localhost",
    [string]$DbPort = "5432",
    [string]$DbUser = "postgres",
    [string]$DbPassword = "",
    [string]$DbName = "DB_Cementerio"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Cementerio Pillaro - Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

function Test-Command {
    param([string]$Command)
    try {
        $null = Get-Command $Command -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
}

function Test-PostgreSQLConnection {
    param(
        [string]$Host,
        [string]$Port,
        [string]$User,
        [string]$Password,
        [string]$Database
    )
    
    try {
        $env:PGPASSWORD = $Password
        $result = & psql -h $Host -p $Port -U $User -d $Database -c "SELECT 1;" 2>&1
        $env:PGPASSWORD = ""
        
        if ($LASTEXITCODE -eq 0) {
            return $true
        }
        return $false
    } catch {
        return $false
    } finally {
        $env:PGPASSWORD = ""
    }
}

Write-Host "[1/7] Verificando requisitos previos..." -ForegroundColor Yellow

if (-not (Test-Command "node")) {
    Write-Host "ERROR: Node.js no está instalado." -ForegroundColor Red
    Write-Host "Por favor instala Node.js 20.14.0 desde: https://nodejs.org/" -ForegroundColor Red
    Write-Host "O usa nvm-windows: https://github.com/coreybutler/nvm-windows" -ForegroundColor Red
    exit 1
}

$nodeVersion = node --version
Write-Host "  ✓ Node.js encontrado: $nodeVersion" -ForegroundColor Green

if (-not (Test-Command "yarn")) {
    Write-Host "  ⚠ Yarn no encontrado. Instalando yarn globalmente..." -ForegroundColor Yellow
    npm install -g yarn
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: No se pudo instalar yarn." -ForegroundColor Red
        exit 1
    }
}

Write-Host "  ✓ Yarn encontrado" -ForegroundColor Green

if (-not (Test-Command "psql")) {
    Write-Host "ERROR: PostgreSQL no está instalado o no está en el PATH." -ForegroundColor Red
    Write-Host "Por favor instala PostgreSQL desde: https://www.postgresql.org/download/windows/" -ForegroundColor Red
    Write-Host "Asegúrate de agregar PostgreSQL al PATH del sistema." -ForegroundColor Red
    exit 1
}

Write-Host "  ✓ PostgreSQL encontrado" -ForegroundColor Green
Write-Host ""

Write-Host "[2/7] Verificando conexión a la base de datos..." -ForegroundColor Yellow

if ([string]::IsNullOrWhiteSpace($DbPassword)) {
    $DbPassword = Read-Host "Ingresa la contraseña de PostgreSQL para el usuario '$DbUser'"
}

if (-not (Test-PostgreSQLConnection -Host $DbHost -Port $DbPort -User $DbUser -Password $DbPassword -Database "postgres")) {
    Write-Host "ERROR: No se pudo conectar a PostgreSQL." -ForegroundColor Red
    Write-Host "Verifica que PostgreSQL esté corriendo y las credenciales sean correctas." -ForegroundColor Red
    exit 1
}

Write-Host "  ✓ Conexión a PostgreSQL exitosa" -ForegroundColor Green

$dbExists = $false
try {
    $env:PGPASSWORD = $DbPassword
    $result = & psql -h $DbHost -p $DbPort -U $DbUser -d "postgres" -tAc "SELECT 1 FROM pg_database WHERE datname='$DbName'" 2>&1
    $env:PGPASSWORD = ""
    
    if ($result -match "1") {
        $dbExists = $true
    }
} catch {
    $dbExists = $false
} finally {
    $env:PGPASSWORD = ""
}

if (-not $dbExists) {
    Write-Host "  ⚠ La base de datos '$DbName' no existe. Creándola..." -ForegroundColor Yellow
    try {
        $env:PGPASSWORD = $DbPassword
        & psql -h $DbHost -p $DbPort -U $DbUser -d "postgres" -c "CREATE DATABASE `"$DbName`";" 2>&1 | Out-Null
        $env:PGPASSWORD = ""
        Write-Host "  ✓ Base de datos '$DbName' creada" -ForegroundColor Green
    } catch {
        $env:PGPASSWORD = ""
        Write-Host "ERROR: No se pudo crear la base de datos." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  ✓ Base de datos '$DbName' existe" -ForegroundColor Green
}
Write-Host ""

Write-Host "[3/7] Configurando variables de entorno..." -ForegroundColor Yellow

$envFile = ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "  ⚠ Archivo .env no encontrado. Creándolo..." -ForegroundColor Yellow
    
    $envContent = @"
DB_TYPE=postgres
DB_HOST=$DbHost
DB_PORT=$DbPort
DB_USER=$DbUser
DB_PASSWORD=$DbPassword
DB_NAME=$DbName
PORT=$Port
JWT_SECRET=your-secret-key-change-in-production
"@
    
    $envContent | Out-File -FilePath $envFile -Encoding UTF8
    Write-Host "  ✓ Archivo .env creado con valores por defecto" -ForegroundColor Green
    Write-Host "  ⚠ IMPORTANTE: Revisa y actualiza el archivo .env con tus valores de producción" -ForegroundColor Yellow
} else {
    Write-Host "  ✓ Archivo .env encontrado" -ForegroundColor Green
}
Write-Host ""

Write-Host "[4/7] Instalando dependencias..." -ForegroundColor Yellow
yarn install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Falló la instalación de dependencias." -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Dependencias instaladas" -ForegroundColor Green
Write-Host ""

Write-Host "[5/7] Compilando aplicación..." -ForegroundColor Yellow
yarn run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Falló la compilación." -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Aplicación compilada exitosamente" -ForegroundColor Green
Write-Host ""

Write-Host "[6/7] Verificando estructura de directorios..." -ForegroundColor Yellow
if (-not (Test-Path "uploads")) {
    New-Item -ItemType Directory -Path "uploads" | Out-Null
    Write-Host "  ✓ Directorio 'uploads' creado" -ForegroundColor Green
} else {
    Write-Host "  ✓ Directorio 'uploads' existe" -ForegroundColor Green
}
Write-Host ""

Write-Host "[7/7] Iniciando aplicación en modo producción..." -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Aplicación iniciada" -ForegroundColor Green
Write-Host "  URL: http://localhost:$Port" -ForegroundColor Cyan
Write-Host "  Swagger: http://localhost:$Port/api" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Presiona Ctrl+C para detener la aplicación" -ForegroundColor Yellow
Write-Host ""

yarn run start:prod

