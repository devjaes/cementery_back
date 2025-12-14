# Flujo Completo: Venta de Mausoleo

## Descripción General
Un **Mausoleo** es un tipo de bloque donde todos los nichos se venden juntos como una unidad. A diferencia de un **Bloque** normal donde cada nicho se vende individualmente, en un Mausoleo:
- Todos los nichos se reservan simultáneamente
- Se genera un único comprobante de pago para todos los nichos
- Al confirmar la venta, todos los nichos pasan a estado VENDIDO
- Se crea un propietario único para todos los nichos del mausoleo

**IMPORTANTE:** El sistema ahora cuenta con **endpoints específicos para mausoleos** que reciben el ID del bloque (mausoleo) directamente, haciendo el proceso más claro y explícito.

---

## Flujo Paso a Paso

### 1️⃣ Crear un Cementerio (Prerequisito)
Si no tienes un cementerio creado, primero debes crear uno.

**Endpoint:** `POST /cementerio`

```json
{
  "nombre": "Cementerio Central",
  "direccion": "Av. Principal 123",
  "telefono": "0987654321",
  "correo": "info@cementeriocentral.com",
  "capacidad": 1000,
  "numero_nichos_disponibles": 1000
}
```

**Respuesta:**
```json
{
  "id_cementerio": "550e8400-e29b-41d4-a716-446655440000",
  "nombre": "Cementerio Central",
  ...
}
```

---

### 2️⃣ Crear un Mausoleo (Bloque tipo Mausoleo)

**Endpoint:** `POST /bloques`

```json
{
  "id_cementerio": "550e8400-e29b-41d4-a716-446655440000",
  "nombre": "Mausoleo Familiar García",
  "descripcion": "Mausoleo de 12 nichos para la familia García",
  "numero_filas": 3,
  "numero_columnas": 4,
  "tipo_bloque": "Mausoleo"
}
```

**Respuesta:**
```json
{
  "id_bloque": "660e8400-e29b-41d4-a716-446655440001",
  "nombre": "Mausoleo Familiar García",
  "descripcion": "Mausoleo de 12 nichos para la familia García",
  "numero_filas": 3,
  "numero_columnas": 4,
  "tipo_bloque": "Mausoleo",
  "id_cementerio": "550e8400-e29b-41d4-a716-446655440000",
  "nichos": [
    {
      "id_nicho": "770e8400-e29b-41d4-a716-446655440002",
      "fila": 1,
      "columna": 1,
      "tipo": "Nicho Simple",
      "estadoVenta": "DISPONIBLE",
      "num_huecos": 1
    },
    {
      "id_nicho": "770e8400-e29b-41d4-a716-446655440003",
      "fila": 1,
      "columna": 2,
      "tipo": "Nicho Simple",
      "estadoVenta": "DISPONIBLE",
      "num_huecos": 1
    },
    // ... 10 nichos más (total 12)
  ]
}
```

**Nota:** Al crear el mausoleo, automáticamente se crean todos los nichos (3 filas × 4 columnas = 12 nichos), cada uno con:
- Estado: `DISPONIBLE`
- Tipo: `Nicho Simple`
- 1 hueco por nicho

---

### 3️⃣ Consultar Nichos del Mausoleo

Para ver todos los nichos del mausoleo creado:

**Endpoint:** `GET /bloques/{id_bloque}/nichos`

```
GET /bloques/660e8400-e29b-41d4-a716-446655440001/nichos
```

**Respuesta:**
```json
{
  "bloque": {
    "id_bloque": "660e8400-e29b-41d4-a716-446655440001",
    "nombre": "Mausoleo Familiar García",
    "tipo_bloque": "Mausoleo"
  },
  "nichos": [
    {
      "id_nicho": "770e8400-e29b-41d4-a716-446655440002",
      "fila": 1,
      "columna": 1,
      "tipo": "Nicho Simple",
      "estadoVenta": "DISPONIBLE",
      "num_huecos": 1,
      "huecos_ocupados": 0
    },
    // ... resto de nichos
  ],
  "total_nichos": 12,
  "disponibles": 12,
  "reservados": 0,
  "vendidos": 0
}
```

---

### 4️⃣ Crear una Persona (Comprador)

Si el comprador no está registrado, créalo primero:

**Endpoint:** `POST /personas`

```json
{
  "tipo_documento": "Cédula",
  "numero_documento": "0912345678",
  "primer_nombre": "Juan",
  "segundo_nombre": "Carlos",
  "primer_apellido": "García",
  "segundo_apellido": "Pérez",
  "fecha_nacimiento": "1980-05-15",
  "genero": "Masculino",
  "estado_civil": "Casado",
  "nacionalidad": "Ecuatoriana",
  "telefono": "0987654321",
  "email": "juan.garcia@email.com",
  "direccion": "Av. Los Granados 456",
  "ciudad": "Guayaquil",
  "provincia": "Guayas"
}
```

**Respuesta:**
```json
{
  "id_persona": "880e8400-e29b-41d4-a716-446655440004",
  "tipo_documento": "Cédula",
  "numero_documento": "0912345678",
  "nombre_completo": "Juan Carlos García Pérez",
  ...
}
```

---

### 5️⃣ Reservar el Mausoleo

Ahora usamos el **endpoint específico para mausoleos** que recibe directamente el ID del bloque (mausoleo).

**Endpoint:** `POST /nicho-sales/mausoleo/reservar`

```json
{
  "idBloque": "660e8400-e29b-41d4-a716-446655440001",
  "idPersona": "880e8400-e29b-41d4-a716-446655440004",
  "monto": 15000.00,
  "generadoPor": "admin-user-id",
  "observaciones": "Venta de mausoleo completo familia García",
  "direccionComprador": "Av. Los Granados 456, Guayaquil"
}
```

**¿Qué hace el sistema?**
- ✅ Verifica que el bloque existe y es de tipo "Mausoleo"
- ✅ Obtiene **todos** los nichos del mausoleo
- ✅ Valida que **todos** los nichos estén DISPONIBLE
- ✅ Reserva todos los nichos simultáneamente (cambian a RESERVADO)
- ✅ Genera un único comprobante de pago para todo el mausoleo
- ✅ Devuelve un PDF con el recibo de reserva

**Respuesta:** 
- **Content-Type:** `application/pdf`
- **Header:** `X-Reserva-Data` contiene el JSON con la información de la reserva

El JSON en el header contiene:
```json
{
  "mausoleo": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "nombre": "Mausoleo Familiar García",
    "descripcion": "Mausoleo de 12 nichos para la familia García",
    "cementerio": "Cementerio Central",
    "totalNichos": 12,
    "nichosReservados": [
      { "id": "770e8400-e29b-41d4-a716-446655440002", "fila": 1, "columna": 1, "estado": "RESERVADO" },
      { "id": "770e8400-e29b-41d4-a716-446655440003", "fila": 1, "columna": 2, "estado": "RESERVADO" },
      // ... 10 nichos más
    ]
  },
  "ordenPago": {
    "id": "990e8400-e29b-41d4-a716-446655440005",
    "codigo": "PAY-2025-001",
    "monto": 15000.00,
    "estado": "pending",
    "fechaGeneracion": "2025-12-14T10:30:00.000Z",
    "comprador": {
      "documento": "0912345678",
      "nombre": "Juan Carlos García Pérez",
      "direccion": "Av. Los Granados 456, Guayaquil"
    },
    "conceptoPago": "Reserva de Mausoleo Familiar García (12 nichos)"
  },
  "mensaje": "Se reservaron 12 nichos del mausoleo Mausoleo Familiar García. El monto total es $15,000.00. Proceda con el pago."
}
```

**📥 El PDF descargado contiene:**
- Código de reserva
- Información del mausoleo (nombre, cantidad de nichos)
- Lista de todos los nichos reservados
- Datos del comprador
- Monto total a pagar
- Fecha de emisión

---

### 6️⃣ Verificar Estado de los Nichos

Después de la reserva, todos los nichos del mausoleo cambiaron a estado RESERVADO:

**Endpoint:** `GET /bloques/{id_bloque}/nichos`

```
GET /bloques/660e8400-e29b-41d4-a716-446655440001/nichos
```

**Respuesta:**
```json
{
  "bloque": {
    "id_bloque": "660e8400-e29b-41d4-a716-446655440001",
    "nombre": "Mausoleo Familiar García",
    "tipo_bloque": "Mausoleo"
  },
  "nichos": [
    {
      "id_nicho": "770e8400-e29b-41d4-a716-446655440002",
      "fila": 1,
      "columna": 1,
      "estadoVenta": "RESERVADO",  // ✅ Cambió de DISPONIBLE a RESERVADO
      ...
    },
    // Todos los nichos están en RESERVADO
  ],
  "total_nichos": 12,
  "disponibles": 0,
  "reservados": 12,  // ✅ Todos reservados
  "vendidos": 0
}
```

---

### 7️⃣ Confirmar el Pago (Finanzas)

Una vez que finanzas verifica el pago, se confirma la venta usando el **endpoint específico para mausoleos**:

**Endpoint:** `PATCH /nicho-sales/mausoleo/confirmar-venta`

```json
{
  "idPago": "990e8400-e29b-41d4-a716-446655440005",
  "validadoPor": "finanzas-user-id",
  "archivoRecibo": "comprobante-banco-12345.pdf"
}
```

**¿Qué hace el sistema?**
- ✅ Verifica que el pago corresponde a una venta de mausoleo (tipo: `mausoleum_sale`)
- ✅ Obtiene el bloque (mausoleo) asociado al pago
- ✅ Obtiene todos los nichos del mausoleo
- ✅ Valida que todos estén en estado RESERVADO
- ✅ Confirma el pago
- ✅ Cambia el estado de **todos** los nichos a VENDIDO

**Respuesta:**
```json
{
  "mausoleo": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "nombre": "Mausoleo Familiar García",
    "cementerio": "Cementerio Central",
    "totalNichos": 12,
    "nichosVendidos": [
      { "id": "770e8400-e29b-41d4-a716-446655440002", "fila": 1, "columna": 1, "estado": "VENDIDO" },
      { "id": "770e8400-e29b-41d4-a716-446655440003", "fila": 1, "columna": 2, "estado": "VENDIDO" },
      // ... 10 nichos más
    ]
  },
  "pago": {
    "id": "990e8400-e29b-41d4-a716-446655440005",
    "codigo": "PAY-2025-001",
    "monto": 15000.00,
    "estado": "paid",
    "fechaPago": "2025-12-14T11:00:00.000Z",
    "validadoPor": "finanzas-user-id",
    "comprador": {
      "documento": "0912345678",
      "nombre": "Juan Carlos García Pérez",
      "direccion": "Av. Los Granados 456, Guayaquil"
    }
  },
  "siguientePaso": {
    "accion": "crear_propietario",
    "mensaje": "Ahora debe registrar al propietario del mausoleo (12 nichos vendidos)",
    "datos": {
      "idBloque": "660e8400-e29b-41d4-a716-446655440001",
      "idPago": "990e8400-e29b-41d4-a716-446655440005",
      "totalNichosVendidos": 12
    }
  },
  "mensaje": "Se confirmó la venta de 12 nichos del mausoleo Mausoleo Familiar García"
}
```

**Resultado:** Todos los 12 nichos del mausoleo pasan de `RESERVADO` → `VENDIDO`

---

### 8️⃣ Registrar al Propietario del Mausoleo

Finalmente, se registra al propietario usando el **endpoint específico para mausoleos** que recibe el ID del bloque:

**Endpoint:** `POST /nicho-sales/mausoleo/registrar-propietario`

```json
{
  "idBloque": "660e8400-e29b-41d4-a716-446655440001",
  "idPersona": "880e8400-e29b-41d4-a716-446655440004",
  "tipoDocumento": "Cédula",
  "numeroDocumento": "0912345678",
  "razon": "Compra de mausoleo familiar"
}
```

**¿Qué hace el sistema?**
- ✅ Verifica que el bloque existe y es de tipo "Mausoleo"
- ✅ Obtiene todos los nichos del mausoleo
- ✅ Valida que todos estén en estado VENDIDO
- ✅ Verifica que ningún nicho tenga propietario activo
- ✅ Crea un registro de `PropietarioNicho` para **cada nicho** del mausoleo
- ✅ Todos los registros tienen la misma persona, fecha y datos

**Respuesta:**
```json
{
  "mausoleo": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "nombre": "Mausoleo Familiar García",
    "totalNichos": 12,
    "propietarios": [
      {
        "id": "aa0e8400-e29b-41d4-a716-446655440006",
        "nicho": { "id": "770e8400-e29b-41d4-a716-446655440002", "fila": 1, "columna": 1 },
        "fechaAdquisicion": "2025-12-14T11:05:00.000Z",
        "tipo": "Dueño",
        "activo": true
      },
      {
        "id": "aa0e8400-e29b-41d4-a716-446655440007",
        "nicho": { "id": "770e8400-e29b-41d4-a716-446655440003", "fila": 1, "columna": 2 },
        "fechaAdquisicion": "2025-12-14T11:05:00.000Z",
        "tipo": "Dueño",
        "activo": true
      },
      // ... 10 propietarios más (uno por cada nicho)
    ]
  },
  "persona": "880e8400-e29b-41d4-a716-446655440004",
  "fechaAdquisicion": "2025-12-14T11:05:00.000Z",
  "mensaje": "Propietario registrado exitosamente para 12 nichos del mausoleo Mausoleo Familiar García"
}
```

**Resultado:** Se crean 12 registros de `PropietarioNicho`, uno para cada nicho del mausoleo, todos con:
- La misma persona propietaria
- La misma fecha de adquisición
- Estado activo
- Tipo: Dueño

---

## 9️⃣ Cancelar Reserva de Mausoleo (Opcional)

Si necesitas cancelar una reserva de mausoleo **antes** de que finanzas confirme el pago:

**Endpoint:** `DELETE /nicho-sales/mausoleo/cancelar-reserva/:idBloque`

```
DELETE /nicho-sales/mausoleo/cancelar-reserva/660e8400-e29b-41d4-a716-446655440001
Content-Type: application/json

{
  "motivo": "Cliente cambió de opinión"
}
```

**¿Qué hace el sistema?**
- ✅ Verifica que el bloque es de tipo "Mausoleo"
- ✅ Obtiene todos los nichos del mausoleo
- ✅ Valida que todos estén en estado RESERVADO
- ✅ Busca el pago pendiente asociado (`status: pending`)
- ✅ Elimina el pago pendiente
- ✅ Cambia todos los nichos de RESERVADO → DISPONIBLE

**Respuesta:**
```json
{
  "mausoleo": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "nombre": "Mausoleo Familiar García",
    "cementerio": "Cementerio Central",
    "totalNichos": 12,
    "nichosCancelados": [
      { "id": "770e8400-e29b-41d4-a716-446655440002", "fila": 1, "columna": 1, "estado": "DISPONIBLE" },
      { "id": "770e8400-e29b-41d4-a716-446655440003", "fila": 1, "columna": 2, "estado": "DISPONIBLE" },
      // ... 10 nichos más
    ]
  },
  "pago": {
    "id": "990e8400-e29b-41d4-a716-446655440005",
    "codigo": "PAY-2025-001",
    "monto": 15000.00
  },
  "mensaje": "Reserva de mausoleo cancelada exitosamente. 12 nichos volvieron a estado DISPONIBLE",
  "motivo": "Cliente cambió de opinión"
}
```

**⚠️ IMPORTANTE:**
- ❌ Solo se puede cancelar si **todos** los nichos están en estado RESERVADO
- ❌ Solo se puede cancelar si el pago está en estado `pending` (no confirmado)
- ✅ Si el pago ya fue confirmado (`status: paid`), **NO se puede cancelar** automáticamente
- ✅ Una vez cancelada, los nichos vuelven a estar disponibles para otra persona

---

**Resultado:** Se crean 12 registros de `PropietarioNicho`, uno para cada nicho del mausoleo, todos con:
- La misma persona propietaria
- La misma fecha de adquisición
- Estado activo
- Tipo: Dueño

---

## 🎯 Resumen del Flujo

| Paso | Acción | Endpoint | Parámetro Principal | Estado Nichos |
|------|--------|----------|---------------------|---------------|
| 1 | Crear Cementerio | `POST /cementerio` | - | - |
| 2 | Crear Mausoleo | `POST /bloques` | `tipo_bloque: "Mausoleo"` | DISPONIBLE (todos) |
| 3 | Crear Persona | `POST /personas` | - | DISPONIBLE (todos) |
| 4 | Reservar Mausoleo | `POST /nicho-sales/mausoleo/reservar` | `idBloque` | RESERVADO (todos) |
| 5 | **[Opcional] Cancelar Reserva** | `DELETE /nicho-sales/mausoleo/cancelar-reserva/:idBloque` | `idBloque` | DISPONIBLE (todos) |
| 6 | Confirmar Pago | `PATCH /nicho-sales/mausoleo/confirmar-venta` | `idPago` | VENDIDO (todos) |
| 7 | Registrar Propietario | `POST /nicho-sales/mausoleo/registrar-propietario` | `idBloque` | VENDIDO (todos) ✅ |

**Nota:** El paso 5 (Cancelar Reserva) solo es posible si el pago aún está pendiente. Una vez confirmado el pago (paso 6), no se puede cancelar la reserva automáticamente.

---

## 🆚 Endpoints: Nicho Individual vs Mausoleo

### Para Nichos Individuales (Bloques normales)
```
POST   /nicho-sales/reservar                    → idNicho
PATCH  /nicho-sales/confirmar-venta            → idPago (de nicho individual)
POST   /nicho-sales/registrar-propietario/:idNicho/:idPersona
DELETE /nicho-sales/cancelar-reserva/:idNicho  → Cancela reserva de nicho
```

### Para Mausoleos (Bloques tipo Mausoleo)
```
POST   /nicho-sales/mausoleo/reservar                  → idBloque
PATCH  /nicho-sales/mausoleo/confirmar-venta          → idPago (de mausoleo)
POST   /nicho-sales/mausoleo/registrar-propietario    → idBloque
DELETE /nicho-sales/mausoleo/cancelar-reserva/:idBloque → Cancela reserva de mausoleo completo
```

**Ventajas de los endpoints específicos para mausoleos:**
- ✅ **Más explícito:** El nombre del endpoint deja claro que se está trabajando con un mausoleo
- ✅ **Mejor API design:** Los parámetros son más semánticos (`idBloque` vs `idNicho`)
- ✅ **Menos ambigüedad:** No hay confusión sobre qué nicho pasar cuando hay 12 nichos
- ✅ **Validación clara:** El backend valida explícitamente que sea un mausoleo
- ✅ **Tipos de pago separados:** `mausoleum_sale` vs `niche_sale`

---

## 🔍 Diferencias: Bloque vs Mausoleo

### Bloque Normal (tipo_bloque: "Bloque")
- ✅ Cada nicho se vende **individualmente**
- ✅ Cada nicho tiene su propio comprobante de pago
- ✅ Los nichos pueden tener diferentes estados (algunos DISPONIBLE, otros RESERVADO, otros VENDIDO)
- ✅ Cada nicho puede tener diferente propietario
- ✅ Se usan los endpoints normales: `/nicho-sales/reservar`, etc.

### Mausoleo (tipo_bloque: "Mausoleo")
- ✅ **Todos** los nichos se venden **juntos** como una unidad
- ✅ Un **único** comprobante de pago para todos los nichos
- ✅ Todos los nichos cambian de estado simultáneamente (DISPONIBLE → RESERVADO → VENDIDO)
- ✅ **Un solo propietario** para todos los nichos (mismo registro en cada nicho)
- ✅ Se usan **endpoints específicos**: `/nicho-sales/mausoleo/reservar`, etc.
- ✅ Se pasa el **ID del bloque** directamente, no el ID de un nicho

---

## 🚨 Validaciones Importantes

### Al Reservar
- ❌ No se puede reservar si algún nicho del mausoleo ya está RESERVADO o VENDIDO
- ✅ Todos los nichos deben estar DISPONIBLE

### Al Cancelar Reserva
- ❌ Solo se puede cancelar si todos los nichos están RESERVADO
- ❌ Solo se puede cancelar si el pago está en estado `pending` (no confirmado)
- ❌ No se puede cancelar si el pago ya fue confirmado (`status: paid`)
- ✅ Todos los nichos deben estar RESERVADO para cancelar

### Al Confirmar Venta
- ❌ No se puede confirmar si algún nicho no está RESERVADO
- ✅ Todos los nichos deben estar RESERVADO
- ✅ El pago debe existir y estar en estado válido

### Al Registrar Propietario
- ❌ No se puede registrar si algún nicho no está VENDIDO
- ❌ No se puede registrar si algún nicho ya tiene propietario activo
- ✅ Todos los nichos deben estar VENDIDO
- ✅ Se crea un propietario para cada nicho del mausoleo

---

## 📝 Notas Adicionales

1. **Idempotencia:** Si intentas reservar un mausoleo ya reservado, confirmar una venta ya confirmada, o registrar un propietario ya registrado, el sistema devuelve el estado actual sin errores.

2. **Transacciones:** Todas las operaciones son atómicas. Si falla alguna parte del proceso (ej: al actualizar el nicho 5 de 12), toda la operación se revierte.

3. **Precio:** El monto total del mausoleo se especifica en la reserva. Es responsabilidad del frontend/usuario calcular el precio basado en la cantidad de nichos.

4. **PDF de Reserva:** El recibo se genera automáticamente con todos los detalles del mausoleo y se descarga directamente.

5. **Consultas:** Puedes usar `GET /bloques/{id}/nichos` en cualquier momento para ver el estado actual de todos los nichos del mausoleo.

---

## 🧪 Colección de Postman

Puedes crear una colección en Postman con estos requests en el orden indicado. Recuerda:
- Guardar los IDs de cada respuesta (cementerio, **bloque/mausoleo**, persona, pago) como variables de entorno
- Reutilizar estos IDs en los siguientes requests
- Usar `{{variable}}` para referenciar los valores guardados

### Variables de Entorno Sugeridas:
```
cementerio_id
mausoleo_id (ID del bloque tipo Mausoleo)
persona_id (comprador)
pago_id (orden de pago del mausoleo)
```

### Estructura de la Colección:
```
📁 Cemetery Management - Mausoleos
  📄 1. POST Create Cementerio
  📄 2. POST Create Mausoleo (tipo_bloque: "Mausoleo")
  📄 3. GET Nichos del Mausoleo
  📄 4. POST Create Persona (Comprador)
  📄 5. POST Reservar Mausoleo (usar {{mausoleo_id}})
  📄 6. GET Verificar Estado Nichos
  📄 7. DELETE Cancelar Reserva Mausoleo [OPCIONAL] (usar {{mausoleo_id}})
  📄 8. PATCH Confirmar Venta Mausoleo (usar {{pago_id}})
  📄 9. POST Registrar Propietario Mausoleo (usar {{mausoleo_id}})
  📄 10. GET Consultar Mausoleo Final
```

**Nota:** El paso 7 (Cancelar Reserva) es opcional y solo se puede ejecutar si el pago está pendiente.

---

## 📋 Ejemplo Completo con Postman

### Ejemplo 1: Flujo Exitoso (Sin Cancelación)
```
1. POST /cementerio → Guardar {{cementerio_id}}
2. POST /bloques (tipo_bloque: "Mausoleo") → Guardar {{mausoleo_id}}
3. POST /personas → Guardar {{persona_id}}
4. POST /nicho-sales/mausoleo/reservar → Guardar {{pago_id}} del header X-Reserva-Data
5. PATCH /nicho-sales/mausoleo/confirmar-venta → Con {{pago_id}}
6. POST /nicho-sales/mausoleo/registrar-propietario → Con {{mausoleo_id}} y {{persona_id}}
✅ Mausoleo vendido y propietario registrado
```

### Ejemplo 2: Flujo con Cancelación
```
1. POST /cementerio → Guardar {{cementerio_id}}
2. POST /bloques (tipo_bloque: "Mausoleo") → Guardar {{mausoleo_id}}
3. POST /personas → Guardar {{persona_id}}
4. POST /nicho-sales/mausoleo/reservar → Guardar {{pago_id}} del header X-Reserva-Data
   ⚠️ Cliente se arrepiente
5. DELETE /nicho-sales/mausoleo/cancelar-reserva/{{mausoleo_id}}
   Body: { "motivo": "Cliente canceló la compra" }
✅ Mausoleo vuelve a estar DISPONIBLE, pago eliminado
6. [Opcional] Repetir desde el paso 4 con otro cliente
```

### Ejemplo 3: Intento de Cancelación Fallido
```
1-4. [Igual que Ejemplo 1]
5. PATCH /nicho-sales/mausoleo/confirmar-venta → Pago confirmado ✅
   ⚠️ Cliente se arrepiente DESPUÉS de confirmar el pago
6. DELETE /nicho-sales/mausoleo/cancelar-reserva/{{mausoleo_id}}
   ❌ Error 400: "No se puede cancelar la reserva: no hay pagos pendientes para este mausoleo"
   
Razón: Una vez que finanzas confirma el pago, los nichos pasan a VENDIDO y ya no se puede cancelar automáticamente.
```

