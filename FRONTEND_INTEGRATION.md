# Guía de Integración Frontend - API de Cementerios y Bloques

Esta guía te ayudará a integrar los endpoints de cementerios y bloques en tu aplicación frontend.

## 🌐 Configuración Base

**URL Base del API**: `http://localhost:3000`

```javascript
const API_BASE_URL = 'http://localhost:3000';
```

---

## 📋 Endpoints Disponibles

### 1. CEMENTERIOS

#### **Crear Cementerio con Bloques** ⭐
```
POST /cementerio
```

**Request:**
```javascript
const crearCementerio = async (datosCementerio) => {
  const response = await fetch(`${API_BASE_URL}/cementerio`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(datosCementerio)
  });
  return response.json();
};

// Uso:
const datos = {
  nombre: "Cementerio Jardines de Paz",
  direccion: "Av. Los Álamos y Calle Primavera",
  telefono: "+593 99 876 5432",
  responsable: "María Gómez",
  bloques: [
    {
      nombre: "Bloque A",
      descripcion: "Zona principal cerca de la entrada",
      numero_filas: 8,
      numero_columnas: 10
    },
    {
      nombre: "Bloque B",
      descripcion: "Área norte del cementerio",
      numero_filas: 12,
      numero_columnas: 15
    }
  ]
};

const resultado = await crearCementerio(datos);
console.log(resultado);
```

**Response (Éxito):**
```json
{
  "success": true,
  "message": "Cementerio creado exitosamente",
  "data": {
    "id_cementerio": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "nombre": "Cementerio Jardines de Paz",
    "direccion": "Av. Los Álamos y Calle Primavera",
    "telefono": "+593 99 876 5432",
    "responsable": "María Gómez",
    "estado": "Activo",
    "fecha_creacion": "2025-11-13T17:30:00Z",
    "bloques": [
      {
        "id_bloque": "b2c3d4e5-f6g7-h890-ijkl-mn1234567891",
        "nombre": "Bloque A",
        "descripcion": "Zona principal cerca de la entrada",
        "numero_filas": 8,
        "numero_columnas": 10,
        "estado": "Activo",
        "fecha_creacion": "2025-11-13T17:30:00Z"
      },
      {
        "id_bloque": "c3d4e5f6-g7h8-i901-jkls-tu1234567892",
        "nombre": "Bloque B",
        "descripcion": "Área norte del cementerio",
        "numero_filas": 12,
        "numero_columnas": 15,
        "estado": "Activo",
        "fecha_creacion": "2025-11-13T17:30:00Z"
      }
    ]
  }
}
```

#### **Obtener Todos los Cementerios**
```
GET /cementerio
```

```javascript
const obtenerCementerios = async () => {
  const response = await fetch(`${API_BASE_URL}/cementerio`);
  return response.json();
};
```

#### **Obtener Cementerio por ID**
```
GET /cementerio/:id
```

```javascript
const obtenerCementerio = async (id) => {
  const response = await fetch(`${API_BASE_URL}/cementerio/${id}`);
  return response.json();
};

// Uso:
const cementerio = await obtenerCementerio('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
```

#### **Buscar Cementerio por Nombre**
```
GET /cementerio/nombre/:nombre
```

```javascript
const buscarCementerio = async (nombre) => {
  const response = await fetch(`${API_BASE_URL}/cementerio/nombre/${nombre}`);
  return response.json();
};

// Uso:
const resultado = await buscarCementerio('Paz');
```

#### **Actualizar Cementerio**
```
PATCH /cementerio/:id
```

```javascript
const actualizarCementerio = async (id, datos) => {
  const response = await fetch(`${API_BASE_URL}/cementerio/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(datos)
  });
  return response.json();
};

// Uso:
const actualizado = await actualizarCementerio('a1b2c3d4...', {
  telefono: '+593 99 111 2222',
  responsable: 'Juan Pérez'
});
```

#### **Eliminar Cementerio**
```
DELETE /cementerio/:id
```

```javascript
const eliminarCementerio = async (id) => {
  const response = await fetch(`${API_BASE_URL}/cementerio/${id}`, {
    method: 'DELETE'
  });
  return response.json();
};
```

---

### 2. BLOQUES

#### **Crear Bloque** (sin cementerio)
```
POST /bloques
```

```javascript
const crearBloque = async (datosBloque) => {
  const response = await fetch(`${API_BASE_URL}/bloques`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(datosBloque)
  });
  return response.json();
};

// Uso:
const datos = {
  id_cementerio: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  nombre: "Bloque C",
  descripcion: "Bloque adicional",
  numero_filas: 10,
  numero_columnas: 12
};

const bloque = await crearBloque(datos);
```

#### **Obtener Todos los Bloques**
```
GET /bloques
```

```javascript
const obtenerBloques = async () => {
  const response = await fetch(`${API_BASE_URL}/bloques`);
  return response.json();
};
```

#### **Obtener Bloques de un Cementerio**
```
GET /bloques/cementerio/:id_cementerio
```

```javascript
const obtenerBloquesPorCementerio = async (idCementerio) => {
  const response = await fetch(`${API_BASE_URL}/bloques/cementerio/${idCementerio}`);
  return response.json();
};

// Uso:
const bloques = await obtenerBloquesPorCementerio('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
console.log(bloques.bloques); // Array de bloques
```

#### **Obtener Bloque por ID**
```
GET /bloques/:id
```

```javascript
const obtenerBloque = async (id) => {
  const response = await fetch(`${API_BASE_URL}/bloques/${id}`);
  return response.json();
};
```

#### **Buscar Bloques por Nombre**
```
GET /bloques/search?nombre=:nombre
```

```javascript
const buscarBloques = async (nombre) => {
  const response = await fetch(`${API_BASE_URL}/bloques/search?nombre=${nombre}`);
  return response.json();
};

// Uso:
const resultados = await buscarBloques('Bloque A');
```

#### **Actualizar Bloque**
```
PATCH /bloques/:id
```

```javascript
const actualizarBloque = async (id, datos) => {
  const response = await fetch(`${API_BASE_URL}/bloques/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(datos)
  });
  return response.json();
};

// Uso:
const actualizado = await actualizarBloque('b2c3d4e5-f6g7...', {
  nombre: "Bloque A Actualizado",
  numero_filas: 12
});
```

#### **Eliminar Bloque**
```
DELETE /bloques/:id
```

```javascript
const eliminarBloque = async (id) => {
  const response = await fetch(`${API_BASE_URL}/bloques/${id}`, {
    method: 'DELETE'
  });
  return response.json();
};
```

---

## 🎯 Casos de Uso Prácticos

### Caso 1: Crear un Cementerio Completo

```javascript
async function crearCementerioCompleto() {
  try {
    const datos = {
      nombre: "Cementerio Municipal",
      direccion: "Calle Principal 123",
      telefono: "+593 2 123 4567",
      responsable: "Director del Cementerio",
      bloques: [
        {
          nombre: "Bloque A",
          numero_filas: 10,
          numero_columnas: 15
        },
        {
          nombre: "Bloque B",
          numero_filas: 8,
          numero_columnas: 12
        }
      ]
    };

    const response = await fetch(`${API_BASE_URL}/cementerio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });

    const resultado = await response.json();
    
    if (resultado.success) {
      console.log('Cementerio creado:', resultado.data.id_cementerio);
      console.log('Bloques creados:', resultado.data.bloques.length);
      return resultado.data;
    }
  } catch (error) {
    console.error('Error:', error);
  }
}
```

### Caso 2: Listar Todos los Cementerios con sus Bloques

```javascript
async function listarCemeteriosConBloques() {
  try {
    const response = await fetch(`${API_BASE_URL}/cementerio`);
    const cementerios = await response.json();

    for (const cementerio of cementerios) {
      console.log(`\n=== ${cementerio.nombre} ===`);
      console.log(`Dirección: ${cementerio.direccion}`);
      console.log(`Responsable: ${cementerio.responsable}`);
      
      // Obtener bloques del cementerio
      const bloqueResponse = await fetch(
        `${API_BASE_URL}/bloques/cementerio/${cementerio.id_cementerio}`
      );
      const bloquesData = await bloqueResponse.json();
      
      console.log(`Bloques: ${bloquesData.bloques.length}`);
      bloquesData.bloques.forEach(bloque => {
        console.log(`  - ${bloque.nombre}: ${bloque.numero_filas}x${bloque.numero_columnas}`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  }
}
```

### Caso 3: Agregar un Nuevo Bloque a un Cementerio Existente

```javascript
async function agregarBloque(idCementerio, nombreBloque) {
  try {
    const datos = {
      id_cementerio: idCementerio,
      nombre: nombreBloque,
      numero_filas: 10,
      numero_columnas: 15
    };

    const response = await fetch(`${API_BASE_URL}/bloques`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });

    const resultado = await response.json();
    
    if (resultado.bloque) {
      console.log('Bloque creado:', resultado.bloque.id_bloque);
      return resultado.bloque;
    }
  } catch (error) {
    console.error('Error al crear bloque:', error);
  }
}
```

---

## 🛠️ Clase Helper para el Frontend

```javascript
class CementerioAPI {
  constructor(baseURL = 'http://localhost:3000') {
    this.baseURL = baseURL;
  }

  // Cementerios
  async crearCementerio(datos) {
    return this.request('POST', '/cementerio', datos);
  }

  async obtenerCementerios() {
    return this.request('GET', '/cementerio');
  }

  async obtenerCementerio(id) {
    return this.request('GET', `/cementerio/${id}`);
  }

  async buscarCementerio(nombre) {
    return this.request('GET', `/cementerio/nombre/${nombre}`);
  }

  async actualizarCementerio(id, datos) {
    return this.request('PATCH', `/cementerio/${id}`, datos);
  }

  async eliminarCementerio(id) {
    return this.request('DELETE', `/cementerio/${id}`);
  }

  // Bloques
  async crearBloque(datos) {
    return this.request('POST', '/bloques', datos);
  }

  async obtenerBloques() {
    return this.request('GET', '/bloques');
  }

  async obtenerBloquesPorCementerio(idCementerio) {
    return this.request('GET', `/bloques/cementerio/${idCementerio}`);
  }

  async obtenerBloque(id) {
    return this.request('GET', `/bloques/${id}`);
  }

  async buscarBloques(nombre) {
    return this.request('GET', `/bloques/search?nombre=${nombre}`);
  }

  async actualizarBloque(id, datos) {
    return this.request('PATCH', `/bloques/${id}`, datos);
  }

  async eliminarBloque(id) {
    return this.request('DELETE', `/bloques/${id}`);
  }

  // Método helper privado
  async request(method, endpoint, body = null) {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, options);
      return await response.json();
    } catch (error) {
      console.error(`Error en ${method} ${endpoint}:`, error);
      throw error;
    }
  }
}

// Uso:
const api = new CementerioAPI();
const cementerios = await api.obtenerCementerios();
```

---

## ⚠️ Manejo de Errores

```javascript
async function crearCementerioConManejo() {
  try {
    const datos = {
      nombre: "Nuevo Cementerio",
      direccion: "Calle 123",
      telefono: "+593 9 123 4567",
      responsable: "Juan"
    };

    const response = await fetch(`${API_BASE_URL}/cementerio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });

    const resultado = await response.json();

    if (!response.ok) {
      // Error del servidor
      console.error('Error:', resultado.message);
      return null;
    }

    if (resultado.success) {
      console.log('Éxito:', resultado.data);
      return resultado.data;
    } else {
      console.error('Error en respuesta:', resultado.message);
      return null;
    }

  } catch (error) {
    // Error de red
    console.error('Error de red:', error);
    return null;
  }
}
```

---

## 📱 Validaciones Frontend

```javascript
function validarCementerio(datos) {
  const errores = [];

  if (!datos.nombre || datos.nombre.trim() === '') {
    errores.push('El nombre del cementerio es requerido');
  }

  if (!datos.direccion || datos.direccion.trim() === '') {
    errores.push('La dirección es requerida');
  }

  if (!datos.telefono || datos.telefono.trim() === '') {
    errores.push('El teléfono es requerido');
  }

  if (!datos.responsable || datos.responsable.trim() === '') {
    errores.push('El responsable es requerido');
  }

  return {
    valido: errores.length === 0,
    errores
  };
}

function validarBloque(datos) {
  const errores = [];

  if (!datos.nombre || datos.nombre.trim() === '') {
    errores.push('El nombre del bloque es requerido');
  }

  if (!datos.id_cementerio) {
    errores.push('El ID del cementerio es requerido');
  }

  if (!datos.numero_filas || datos.numero_filas < 1) {
    errores.push('Número de filas debe ser mayor a 0');
  }

  if (!datos.numero_columnas || datos.numero_columnas < 1) {
    errores.push('Número de columnas debe ser mayor a 0');
  }

  return {
    valido: errores.length === 0,
    errores
  };
}

// Uso:
const datosCementerio = { nombre: '', direccion: 'Calle 1', telefono: '123', responsable: 'Juan' };
const validacion = validarCementerio(datosCementerio);
if (!validacion.valido) {
  console.error(validacion.errores);
}
```

---

## 🔄 Flujo Recomendado en tu Frontend

1. **Crear Cementerio** → Recibe `id_cementerio`
2. **Mostrar Bloques** → Listar bloques del cementerio
3. **Permitir CRUD de Bloques** → Crear, editar, eliminar bloques
4. **Gestionar Nichos** → (Próximo módulo)

---

## 📚 Swagger UI

Para ver la documentación interactiva, accede a:
```
http://localhost:3000/api
```

Allí puedes probar todos los endpoints directamente.
