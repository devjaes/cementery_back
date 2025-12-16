# Ampliación de Mausoleos - Documentación

## Endpoint

```
POST /bloques/:id/ampliar-bloque
Content-Type: multipart/form-data
```

## Parámetros

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `numero_filas` | integer | ✅ | Número de filas a agregar (mínimo 1) |
| `numero_columnas` | integer | ✅ | Debe coincidir con las columnas del bloque original |
| `observacion_ampliacion` | string | ✅ | Observación sobre la ampliación (máx 1000 caracteres) |
| `file` | binary | ✅ | Archivo PDF de la ampliación |

## Validaciones Backend

- ✅ Solo bloques tipo "Mausoleo" pueden ampliarse
- ✅ Número de columnas debe coincidir exactamente con el original
- ✅ Archivo PDF es obligatorio y debe ser tipo `application/pdf`
- ✅ Crecimiento solo vertical (filas aumentan, columnas constantes)
- ✅ Numeración de nichos es secuencial desde el último existente

## Respuesta Exitosa (200)

```json
{
  "mensaje": "Mausoleo ampliado exitosamente",
  "bloque": {
    "id_bloque": "uuid",
    "nombre": "Mausoleo Familiar García",
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
    "pdf": "/uploads/ampliaciones/AMP-2024-1702745123456/ampliacion_1702745123456.pdf",
    "codigo_ampliacion": "AMP-2024-1702745123456"
  },
  "total_nichos_bloque": 15
}
```

## Errores Comunes

| Código | Mensaje |
|--------|---------|
| 400 | "Se requiere un archivo PDF de ampliación (file)" |
| 400 | "Solo se permiten archivos PDF" |
| 400 | "Solo se pueden ampliar bloques de tipo Mausoleo" |
| 400 | "El número de columnas debe coincidir con el original (N)" |
| 404 | "Bloque no encontrado o inactivo" |

## Implementación Frontend

### 1. Formulario de Ampliación

```jsx
import { useState } from 'react';

function AmpliarMausoleoForm({ bloqueId, columnasOriginales }) {
  const [filas, setFilas] = useState(1);
  const [observacion, setObservacion] = useState('');
  const [pdfFile, setPdfFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('numero_filas', filas);
    formData.append('numero_columnas', columnasOriginales);
    formData.append('observacion_ampliacion', observacion);
    formData.append('file', pdfFile);

    try {
      const response = await fetch(
        `http://localhost:3005/bloques/${bloqueId}/ampliar-bloque`,
        {
          method: 'POST',
          body: formData,
        }
      );
      
      const data = await response.json();
      
      if (response.ok) {
        alert('Mausoleo ampliado exitosamente');
        console.log(data);
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      alert('Error al ampliar mausoleo');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Filas a agregar:</label>
        <input 
          type="number" 
          min="1" 
          value={filas}
          onChange={(e) => setFilas(e.target.value)}
          required 
        />
      </div>

      <div>
        <label>Columnas (fijo):</label>
        <input 
          type="number" 
          value={columnasOriginales}
          disabled 
        />
      </div>

      <div>
        <label>Observación:</label>
        <textarea 
          value={observacion}
          onChange={(e) => setObservacion(e.target.value)}
          maxLength={1000}
          required
        />
      </div>

      <div>
        <label>PDF de Ampliación:</label>
        <input 
          type="file" 
          accept=".pdf"
          onChange={(e) => setPdfFile(e.target.files[0])}
          required 
        />
      </div>

      <button type="submit">Ampliar Mausoleo</button>
    </form>
  );
}
```

### 2. Visualizar PDF de Ampliación

```jsx
function VisualizarPDFAmpliacion({ pdfPath }) {
  const pdfUrl = `http://localhost:3005${pdfPath}`;
  
  return (
    <div>
      <h3>PDF de Ampliación</h3>
      <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
        Abrir PDF en nueva pestaña
      </a>
      <iframe 
        src={pdfUrl}
        width="100%" 
        height="600px"
        title="PDF Ampliación"
      />
    </div>
  );
}
```

### 3. Obtener Nichos con PDF

Los nichos creados durante la ampliación tendrán el campo `pdf_ampliacion`:

```javascript
// GET /bloques/:id/nichos
const response = await fetch(`http://localhost:3005/bloques/${bloqueId}/nichos`);
const data = await response.json();

data.nichos.forEach(nicho => {
  if (nicho.pdf_ampliacion) {
    console.log('Nicho con ampliación:', nicho.numero);
    console.log('PDF:', nicho.pdf_ampliacion);
    console.log('Observación:', nicho.observacion_ampliacion);
  }
});
```

## Notas Importantes

- Los archivos PDF se guardan en `/uploads/ampliaciones/AMP-{año}-{timestamp}/`
- Los PDFs son accesibles directamente vía HTTP (configurado en `main.ts`)
- Cada ampliación genera un código único para organizar los archivos
- Los nichos nuevos tienen numeración secuencial automática
- Solo mausoleos pueden ampliarse (bloques regulares no)
