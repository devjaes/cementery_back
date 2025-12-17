# Documentación: Ampliación de Mausoleos

## Endpoint Principal

### POST `/nichos/mausoleo/:id_bloque/ampliar`

Amplía un mausoleo agregando nuevas filas de nichos de forma vertical.

**Parámetros de ruta:**
- `id_bloque` (UUID): ID del bloque/mausoleo a ampliar

**Body (multipart/form-data):**
- `numero_filas` (integer): Número de filas a agregar
- `numero_columnas` (integer): Debe coincidir con el número de columnas original
- `observacion_ampliacion` (string): Observación sobre la ampliación
- `file` (PDF): Archivo PDF de autorización (obligatorio)

**Respuesta exitosa (200):**
```json
{
  "mensaje": "Mausoleo ampliado exitosamente",
  "bloque": {
    "id_bloque": "uuid",
    "nombre": "Mausoleo Familiar",
    "numero_filas_anterior": 3,
    "numero_filas_nuevo": 5,
    "numero_columnas": 3
  },
  "ampliacion": {
    "filas_agregadas": 2,
    "nichos_creados": 6,
    "huecos_creados": 6,
    "rango_numeros": "10 - 15",
    "observacion": "Ampliación autorizada",
    "pdf": "/uploads/ampliaciones/AMP-2025-xxx/ampliacion_xxx.pdf",
    "codigo_ampliacion": "AMP-2025-xxx"
  }
}
```

---

## Endpoints de Consulta

### GET `/nichos/:id_nicho/ampliacion`

Obtiene la información de ampliación de **un nicho específico**.

**Parámetros:**
- `id_nicho` (UUID): ID del nicho

**Respuesta:**
```json
{
  "id_nicho": "uuid",
  "numero": "10",
  "observacion_ampliacion": "Ampliación autorizada 2024",
  "pdf_ampliacion": "/uploads/ampliaciones/AMP-2024-xxx/ampliacion_xxx.pdf"
}
```

**Errores:**
- `404`: Nicho no encontrado o no tiene datos de ampliación

---

### GET `/nichos/ampliaciones/:id_bloque`

Obtiene todos los nichos creados por ampliaciones de un mausoleo específico.

**Parámetros:**
- `id_bloque` (UUID): ID del bloque/mausoleo

**Respuesta:**
```json
{
  "id_bloque": "uuid",
  "nombre_bloque": "Mausoleo Familiar",
  "total_ampliaciones": 6,
  "nichos": [
    {
      "id_nicho": "uuid",
      "numero": "10",
      "fila": 4,
      "columna": 1,
      "num_huecos": 1,
      "observacion_ampliacion": "Ampliación autorizada 2024",
      "pdf_ampliacion": "/uploads/ampliaciones/AMP-2024-xxx/ampliacion_xxx.pdf",
      "fecha_construccion": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### GET `/nichos/ampliacion/:id_nicho/pdf`

Descarga el PDF de ampliación asociado a un nicho.

**Parámetros:**
- `id_nicho` (UUID): ID del nicho

**Respuesta:**
- Archivo PDF para descarga

---

### PATCH `/nichos/ampliacion/:id_nicho`

Actualiza la información de ampliación de un nicho específico (observación y/o PDF).

**Parámetros:**
- `id_nicho` (UUID): ID del nicho a actualizar

**Body (multipart/form-data):**
- `observacion_ampliacion` (string, opcional): Nueva observación sobre la ampliación
- `file` (PDF, opcional): Nuevo archivo PDF de autorización

**Nota:** Se debe proporcionar al menos uno de los dos campos.

**Respuesta exitosa (200):**
```json
{
  "mensaje": "Ampliación actualizada exitosamente",
  "nicho": {
    "id_nicho": "uuid",
    "numero": "10",
    "observacion_ampliacion": "Ampliación actualizada - documentación revisada",
    "pdf_ampliacion": "/uploads/ampliaciones/AMP-2025-xxx/ampliacion_xxx.pdf"
  }
}
```

**Errores:**
- `400`: Nicho no tiene datos de ampliación o no se proporcionó ningún campo para actualizar
- `404`: Nicho no encontrado

---

## Almacenamiento de PDFs

Los PDFs se guardan físicamente en:
```
uploads/ampliaciones/{CODIGO_AMPLIACION}/ampliacion_{timestamp}.pdf
```

Donde `CODIGO_AMPLIACION` tiene el formato: `AMP-{año}-{timestamp}`

Los PDFs son accesibles directamente vía HTTP gracias a la configuración en `main.ts`:
```
http://localhost:3005/uploads/ampliaciones/AMP-2025-xxx/ampliacion_xxx.pdf
```

---

## Campos en la Entidad Nicho

- `observacion_ampliacion` (string, opcional): Observación sobre la ampliación
- `pdf_ampliacion` (string, opcional): Ruta relativa al PDF (`/uploads/ampliaciones/...`)

---

## Ejemplo de Uso en Frontend

### Ampliar Mausoleo

```typescript
const ampliarMausoleo = async (idBloque: string, data: {
  numero_filas: number;
  numero_columnas: number;
  observacion_ampliacion: string;
  file: File;
}) => {
  const formData = new FormData();
  formData.append('numero_filas', data.numero_filas.toString());
  formData.append('numero_columnas', data.numero_columnas.toString());
  formData.append('observacion_ampliacion', data.observacion_ampliacion);
  formData.append('file', data.file);

  const response = await axios.post(
    `/nichos/mausoleo/${idBloque}/ampliar`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' }
    }
  );
  
  return response.data;
};
```

### Obtener Ampliación de un Nicho

```typescript
const getAmpliacionNicho = async (idNicho: string) => {
  const response = await axios.get(`/nichos/${idNicho}/ampliacion`);
  return response.data;
};

// Uso
const ampliacion = await getAmpliacionNicho('uuid-del-nicho');
console.log(ampliacion.numero);  // "10"
console.log(ampliacion.observacion_ampliacion);  // "Ampliación autorizada"
console.log(ampliacion.pdf_ampliacion);  // "/uploads/..."
```

### Obtener Ampliaciones de un Bloque (todas)

```typescript
const getAmpliaciones = async (idBloque: string) => {
  const response = await axios.get(`/nichos/ampliaciones/${idBloque}`);
  return response.data;
};
```

### Descargar PDF

```typescript
const downloadPDF = async (idNicho: string) => {
  const response = await axios.get(
    `/nichos/ampliacion/${idNicho}/pdf`,
    { responseType: 'blob' }
  );
  
  // Crear link de descarga
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `ampliacion_${idNicho}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};
```

### Actualizar Ampliación

```typescript
const updateAmpliacion = async (idNicho: string, data: {
  observacion_ampliacion?: string;
  file?: File;
}) => {
  const formData = new FormData();
  
  if (data.observacion_ampliacion) {
    formData.append('observacion_ampliacion', data.observacion_ampliacion);
  }
  
  if (data.file) {
    formData.append('file', data.file);
  }

  const response = await axios.patch(
    `/nichos/ampliacion/${idNicho}`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' }
    }
  );
  
  return response.data;
};

// Uso - Actualizar solo observación
await updateAmpliacion('uuid-del-nicho', {
  observacion_ampliacion: 'Nueva observación actualizada'
});

// Uso - Actualizar solo PDF
await updateAmpliacion('uuid-del-nicho', {
  file: nuevoPdfFile
});

// Uso - Actualizar ambos
await updateAmpliacion('uuid-del-nicho', {
  observacion_ampliacion: 'Observación actualizada',
  file: nuevoPdfFile
});
```

### Visualizar PDF en iframe

```jsx
<iframe 
  src={`http://localhost:3005${nicho.pdf_ampliacion}`}
  width="100%"
  height="600px"
  title="PDF de Ampliación"
/>
```

---

## Validaciones

1. ✅ Solo bloques tipo "Mausoleo" pueden ser ampliados
2. ✅ El número de columnas debe coincidir con el original (crecimiento vertical únicamente)
3. ✅ El PDF es obligatorio y debe ser de tipo `application/pdf`
4. ✅ Los nichos se numeran secuencialmente desde el último número existente
5. ✅ Cada nicho nuevo tiene 1 hueco por defecto
6. ✅ Estado inicial: `Activo` y `Disponible`

---

## Notas Técnicas

- **Implementación**: Usa SQL raw directo para evitar problemas con TypeORM
- **Transacciones**: No usa transacciones explícitas (cada INSERT es atómico)
- **Numeración**: Secuencial basada en el máximo número existente
- **Archivos**: Se crean directorios únicos por ampliación para organización

curl http://localhost:3000/nichos/8a9256cc-02af-48a7-a1c5-e63052db8190/ampliacion
