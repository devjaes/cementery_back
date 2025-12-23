# Sistema de Venta de Nichos

## Descripción del Flujo

El sistema de venta de nichos está integrado con el módulo de pagos y sigue un flujo de tres pasos principales. Soporta dos tipos de ventas:

### Venta Individual (Bloques)
- Cada nicho se vende independientemente
- Un pago por nicho
- Un propietario por nicho

### Venta Conjunta (Mausoleos)
- **Todos los nichos del mausoleo se venden juntos**
- **Un solo pago para todos los nichos**
- **Todos los nichos cambian de estado simultáneamente** (DISPONIBLE → RESERVADO → VENDIDO)
- El comprador será propietario de todos los nichos del mausoleo

---

## 1. Reserva de Nicho
**Endpoint:** `POST /nicho-sales/reservar`

El usuario reserva un nicho, lo que:
- Cambia el estado del nicho a `RESERVADO`
- **Si es un mausoleo, reserva TODOS los nichos del bloque**
- Crea una orden de pago en estado `pending`
- Retorna información del nicho, cliente y orden de pago

**Request Body:**
```json
{
  "idNicho": "uuid-del-nicho",
  "idPersona": "uuid-del-cliente",
  "monto": 500.00,
  "generadoPor": "admin@cemetery.com",
  "observaciones": "Reserva para familia Pérez",
  "direccionComprador": "Calle Principal 123"
}
```

**Response (Bloque Individual):**
```json
{
  "nicho": {
    "id": "uuid",
    "fila": "1",
    "columna": "001",
    "estado": "RESERVADO",
    "cementerio": "Cementerio Central"
  },
  "cliente": {
    "id": "uuid",
    "nombres": "Juan",
    "apellidos": "Pérez",
    "cedula": "1234567890"
  },
  "ordenPago": {
    "id": "uuid",
    "codigo": "PAY-241010-123456-001",
    "monto": 500.00,
    "estado": "pending",
    "fechaGeneracion": "2024-10-10T10:00:00Z",
    "comprador": {
      "documento": "1234567890",
      "nombre": "Juan Pérez",
      "direccion": "Calle Principal 123"
    }
  }
}
```

**Response (Mausoleo):**
```json
{
  "nicho": {
    "id": "uuid",
    "fila": "1",
    "columna": "001",
    "estado": "RESERVADO",
    "cementerio": "Cementerio Central",
    "mausoleo": {
      "nombre": "Mausoleo Familia García",
      "totalNichos": 6,
      "nichosReservados": [
        { "id": "uuid1", "fila": "1", "columna": "001" },
        { "id": "uuid2", "fila": "1", "columna": "002" },
        { "id": "uuid3", "fila": "2", "columna": "001" },
        { "id": "uuid4", "fila": "2", "columna": "002" },
        { "id": "uuid5", "fila": "3", "columna": "001" },
        { "id": "uuid6", "fila": "3", "columna": "002" }
      ]
    }
  },
  "cliente": {
    "id": "uuid",
    "nombres": "Juan",
    "apellidos": "Pérez",
    "cedula": "1234567890"
  },
  "ordenPago": {
    "id": "uuid",
    "codigo": "PAY-241010-123456-001",
    "monto": 3000.00,
    "estado": "pending",
    "fechaGeneracion": "2024-10-10T10:00:00Z",
    "comprador": {
      "documento": "1234567890",
      "nombre": "Juan Pérez",
      "direccion": "Calle Principal 123"
    }
  },
  "mensaje": "Se han reservado 6 nichos del mausoleo Mausoleo Familia García"
}
```

### 2. Confirmación de Venta
**Endpoint:** `PATCH /nicho-sales/confirmar-venta`

Finanzas aprueba el pago, lo que:
- Marca el pago como `paid`
- Cambia el estado del nicho a `VENDIDO`
- **Si es un mausoleo, marca TODOS los nichos como VENDIDOS**
- Indica el siguiente paso: registrar propietario

**Request Body:**
```json
{
  "idPago": "uuid-del-pago",
  "validadoPor": "finanzas@cemetery.com",
  "archivoRecibo": "path/to/receipt.pdf"
}
```

**Response (Bloque Individual):**
```json
{
  "nicho": {
    "id": "uuid",
    "fila": "1",
    "columna": "001",
    "estado": "VENDIDO",
    "cementerio": "Cementerio Central"
  },
  "pago": {
    "id": "uuid",
    "codigo": "PAY-241010-123456-001",
    "monto": 500.00,
    "estado": "paid",
    "fechaPago": "2024-10-10T15:00:00Z",
    "validadoPor": "finanzas@cemetery.com",
    "comprador": {
      "documento": "1234567890",
      "nombre": "Juan Pérez",
      "direccion": "Calle Principal 123"
    }
  },
  "siguientePaso": {
    "accion": "crear_propietario",
    "mensaje": "Ahora debe registrar al propietario del nicho",
    "datos": {
      "idNicho": "uuid",
      "idPago": "uuid"
    }
  }
}
```

**Response (Mausoleo):**
```json
{
  "nicho": {
    "id": "uuid",
    "fila": "1",
    "columna": "001",
    "estado": "VENDIDO",
    "cementerio": "Cementerio Central",
    "mausoleo": {
      "nombre": "Mausoleo Familia García",
      "totalNichos": 6,
      "nichosVendidos": [
        { "id": "uuid1", "fila": "1", "columna": "001" },
        { "id": "uuid2", "fila": "1", "columna": "002" },
        { "id": "uuid3", "fila": "2", "columna": "001" },
        { "id": "uuid4", "fila": "2", "columna": "002" },
        { "id": "uuid5", "fila": "3", "columna": "001" },
        { "id": "uuid6", "fila": "3", "columna": "002" }
      ]
    }
  },
  "pago": {
    "id": "uuid",
    "codigo": "PAY-241010-123456-001",
    "monto": 3000.00,
    "estado": "paid",
    "fechaPago": "2024-10-10T15:00:00Z",
    "validadoPor": "finanzas@cemetery.com",
    "comprador": {
      "documento": "1234567890",
      "nombre": "Juan Pérez",
      "direccion": "Calle Principal 123"
    }
  },
  "siguientePaso": {
    "accion": "crear_propietario",
    "mensaje": "Ahora debe registrar al propietario del mausoleo (6 nichos vendidos)",
    "datos": {
      "idNicho": "uuid",
      "idPago": "uuid",
      "totalNichosVendidos": 6
    }
  },
  "mensaje": "Se confirmó la venta de 6 nichos del mausoleo Mausoleo Familia García"
}
```
```

### 3. Registro de Propietario
**Endpoint:** `POST /nicho-sales/registrar-propietario/:idNicho/:idPersona`

Se registra el vínculo entre el cliente y el nicho:
- Crea la relación propietario-nicho
- Establece el tipo como "Dueño"
- Marca como activo

**Request Body:**
```json
{
  "tipoDocumento": "Escritura",
  "numeroDocumento": "ESC-2024-001",
  "razon": "Compra de nicho familiar"
}
```

## Endpoints Adicionales

### Historial de Ventas
**Endpoint:** `GET /nicho-sales/historial`

Obtiene el historial de ventas con filtros opcionales:

**Query Parameters:**
- `estado`: Filtrar por EstadoNicho
- `cementerio`: ID del cementerio
- `sector`: Sector del nicho
- `fechaDesde`: Fecha desde (ISO string)
- `fechaHasta`: Fecha hasta (ISO string)

### Cancelar Reserva
**Endpoint:** `DELETE /nicho-sales/cancelar-reserva/:idNicho`

Cancela una reserva (solo si el pago no ha sido confirmado):
- Elimina la orden de pago pendiente
- Cambia el estado del nicho a `DISPONIBLE`

**Request Body:**
```json
{
  "motivo": "Cliente cambió de opinión"
}
```

## Estados del Nicho

- `DISPONIBLE`: Nicho disponible para reserva
- `RESERVADO`: Nicho reservado, pago pendiente
- `VENDIDO`: Nicho vendido, pago confirmado
- `BLOQUEADO`: Nicho bloqueado administrativamente

## Integración con Módulos

### Módulo de Pagos
- Crea órdenes de pago con tipo `niche_sale`
- Genera códigos únicos de pago
- Maneja confirmación de pagos
- Permite generar recibos en PDF

### Módulo de Propietarios
- Registra la relación propietario-nicho
- Maneja tipos de propietario (Dueño, Heredero)
- Controla propietarios activos/inactivos

## Validaciones

1. **Reserva:**
   - Nicho debe existir y estar disponible
   - Persona debe existir y no estar fallecida
   - No puede haber propietarios activos previos
   - **Si es mausoleo: TODOS los nichos deben estar DISPONIBLES**

2. **Confirmación:**
   - Pago debe existir y estar pendiente
   - Nicho debe estar reservado
   - Debe ser pago tipo `niche_sale`
   - **Si es mausoleo: TODOS los nichos deben estar RESERVADOS**

3. **Registro Propietario:**
   - Nicho debe estar vendido
   - No debe tener propietario activo
   - Persona no debe estar fallecida

## Diferencias entre Bloque y Mausoleo

| Característica | Bloque | Mausoleo |
|---------------|--------|----------|
| **Creación de nichos** | Automática (al crear bloque) | Automática (al crear bloque) |
| **Estado inicial** | DISPONIBLE | DISPONIBLE |
| **Venta** | Individual por nicho | Conjunta (todos los nichos) |
| **Pago** | Un pago por nicho | Un pago para todos los nichos |
| **Cambio de estado** | Solo el nicho seleccionado | Todos los nichos del mausoleo |
| **Propietario** | Uno por nicho | Uno para todos los nichos |

## Manejo de Errores

- `NotFoundException`: Recurso no encontrado
- `BadRequestException`: Validación de negocio fallida
- `InternalServerErrorException`: Error interno del servidor

Todos los errores incluyen mensajes descriptivos para facilitar la depuración.