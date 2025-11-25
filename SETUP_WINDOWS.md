# Guía de Instalación y Ejecución - Windows 10

Esta guía te ayudará a configurar y ejecutar la aplicación Cementerio Pillaro en una máquina Windows 10 con 4GB de RAM, **sin usar Docker**.

## Requisitos Previos

### 1. Node.js 20.14.0

**Opción A: Instalación directa**
- Descarga desde: https://nodejs.org/
- Instala la versión LTS (20.x)

**Opción B: Usando nvm-windows (recomendado)**
```powershell
# Instala nvm-windows desde: https://github.com/coreybutler/nvm-windows/releases
# Luego ejecuta:
nvm install 20.14.0
nvm use 20.14.0
```

### 2. PostgreSQL

1. Descarga PostgreSQL desde: https://www.postgresql.org/download/windows/
2. Durante la instalación:
   - Anota la contraseña del usuario `postgres` (la necesitarás)
   - Asegúrate de agregar PostgreSQL al PATH del sistema
3. Verifica la instalación:
```powershell
psql --version
```

### 3. Yarn (se instalará automáticamente si no está)

El script verificará e instalará yarn automáticamente si no está presente.

## Configuración de PostgreSQL para 4GB de RAM

Para optimizar PostgreSQL en una máquina con 4GB de RAM, ajusta la configuración:

1. Abre `postgresql.conf` (ubicado en la carpeta de datos de PostgreSQL)
2. Modifica estos valores:
```ini
shared_buffers = 512MB
effective_cache_size = 1536MB
maintenance_work_mem = 128MB
work_mem = 16MB
max_connections = 50
```

3. Reinicia el servicio de PostgreSQL desde "Servicios" de Windows.

## Ejecución de la Aplicación

### Primera vez (Setup completo)

```powershell
.\start-app.ps1
```

Este script:
- Verifica todos los requisitos
- Crea la base de datos si no existe
- Crea el archivo `.env` con valores por defecto
- Instala dependencias
- Compila la aplicación
- Inicia el servidor

**Parámetros opcionales:**
```powershell
.\start-app.ps1 -Port 3005 -DbHost localhost -DbPort 5432 -DbUser postgres -DbName DB_Cementerio
```

Si no proporcionas la contraseña, el script te la pedirá.

### Ejecuciones posteriores (Rápido)

```powershell
.\start-app-quick.ps1
```

Este script asume que todo está configurado y solo compila e inicia la aplicación.

## Configuración Manual del Archivo .env

Si prefieres configurar manualmente, crea un archivo `.env` en la raíz del proyecto:

```env
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_contraseña_postgres
DB_NAME=DB_Cementerio
PORT=3005
JWT_SECRET=tu-clave-secreta-jwt-cambiar-en-produccion
```

## Verificación

Una vez iniciada la aplicación:

- **API**: http://localhost:3005
- **Swagger Documentation**: http://localhost:3005/api

## Solución de Problemas

### Error: "Node.js no está instalado"
- Instala Node.js 20.14.0 desde https://nodejs.org/
- Verifica con: `node --version`

### Error: "PostgreSQL no está en el PATH"
- Agrega la ruta de PostgreSQL al PATH del sistema:
  - Generalmente: `C:\Program Files\PostgreSQL\16\bin`
- Reinicia PowerShell después de modificar el PATH

### Error: "No se pudo conectar a PostgreSQL"
- Verifica que el servicio de PostgreSQL esté corriendo:
  - Abre "Servicios" (Win+R → services.msc)
  - Busca "postgresql-x64-16" (o similar)
  - Asegúrate de que esté "En ejecución"
- Verifica las credenciales en el archivo `.env`

### Error: "Puerto ya en uso"
- Cambia el puerto en el archivo `.env`: `PORT=3006`
- O detén el proceso que está usando el puerto:
```powershell
netstat -ano | findstr :3005
taskkill /PID <PID> /F
```

### Optimización de Memoria

Si experimentas problemas de memoria:

1. **Cierra otras aplicaciones** que consuman mucha RAM
2. **Reduce las conexiones de PostgreSQL** en `postgresql.conf`:
   ```ini
   max_connections = 30
   ```
3. **Usa modo producción** (ya está configurado en el script)
4. **No uses watch mode** en desarrollo (consume más memoria)

## Comandos Útiles

```powershell
# Verificar versión de Node
node --version

# Verificar versión de PostgreSQL
psql --version

# Verificar que PostgreSQL esté corriendo
Get-Service | Where-Object {$_.Name -like "*postgres*"}

# Conectar a PostgreSQL manualmente
psql -U postgres -h localhost

# Ver bases de datos
psql -U postgres -h localhost -c "\l"

# Verificar puertos en uso
netstat -ano | findstr :3005
netstat -ano | findstr :5432
```

## Notas Importantes

- El script usa **modo producción** (`start:prod`) para optimizar el uso de memoria
- La base de datos se crea automáticamente si no existe
- El directorio `uploads` se crea automáticamente si no existe
- **NO** uses Docker - este setup es para ejecución nativa

