# Sistema de Venta de Nichos

## Descripción del Flujo

El sistema de venta de nichos está integrado con el módulo de pagos y sigue un flujo de tres pasos principales3. **Registro de Propietario:**
   - Nicho debe estar vendido
   - No debe tener propietario activo
   - Persona no debe estar fallecida
   - Los datos del documento se proporcionan en este paso## 1. Reserva de Nicho
**Endpoint:** `POST /nicho-sales/reservar`

El usuario reserva un nicho, lo que:
- Cambia el estado del nicho a `RESERVADO`
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

**Response:**
```json
{
  "nicho": {
    "id": "uuid",
    "sector": "A",
    "fila": "1",
    "numero": "001",
    "estado": "Reservado",
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

### 2. Confirmación de Venta
**Endpoint:** `PATCH /nicho-sales/confirmar-venta`

Finanzas aprueba el pago, lo que:
- Marca el pago como `paid`
- Cambia el estado del nicho a `VENDIDO`
- Indica el siguiente paso: registrar propietario

**Request Body:**
```json
{
  "idPago": "uuid-del-pago",
  "validadoPor": "finanzas@cemetery.com",
  "archivoRecibo": "path/to/receipt.pdf"
}
```

**Response:**
```json
{
  "nicho": {
    "id": "uuid",
    "estado": "Vendido"
  },
  "pago": {
    "id": "uuid",
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
    "mensaje": "Ahora debe registrar al propietario del nicho"
  }
}
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

2. **Confirmación:**
   - Pago debe existir y estar pendiente
   - Nicho debe estar reservado
   - Debe ser pago tipo `niche_sale`

3. **Registro Propietario:**
   - Nicho debe estar vendido
   - No debe tener propietario activo
   - Persona no debe estar fallecida

## Manejo de Errores

- `NotFoundException`: Recurso no encontrado
- `BadRequestException`: Validación de negocio fallida
- `InternalServerErrorException`: Error interno del servidor

Todos los errores incluyen mensajes descriptivos para facilitar la depuración.