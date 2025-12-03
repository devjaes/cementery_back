export enum TipoNicho {
  NICHO = 'Nicho',
  MAUSOLEO = 'Mausoleo',
  FOSA = 'Fosa',
  BOVEDA = 'Bóveda',
}

/**
 * Configuración de restricciones por tipo de nicho
 */
export const RESTRICCIONES_TIPO_NICHO = {
  [TipoNicho.NICHO]: {
    minHuecos: 1,
    maxHuecos: null, // ilimitado
    descripcion: 'Permite múltiples huecos sin límite',
  },
  [TipoNicho.MAUSOLEO]: {
    minHuecos: 1,
    maxHuecos: null, // ilimitado
    descripcion: 'Permite múltiples huecos sin límite',
  },
  [TipoNicho.FOSA]: {
    minHuecos: 1,
    maxHuecos: 1, // solo un hueco
    descripcion: 'Solo permite un hueco',
  },
  [TipoNicho.BOVEDA]: {
    minHuecos: 1,
    maxHuecos: 1, // solo un hueco
    descripcion: 'Solo permite un hueco',
  },
};

/**
 * Valida si un tipo de nicho acepta la cantidad de huecos especificada
 * @param tipo Tipo de nicho
 * @param numHuecos Cantidad de huecos
 * @returns true si es válido, false si no
 */
export function validarNumHuecosPorTipo(
  tipo: TipoNicho,
  numHuecos: number,
): boolean {
  const restriccion = RESTRICCIONES_TIPO_NICHO[tipo];
  
  if (!restriccion) {
    return false;
  }

  if (numHuecos < restriccion.minHuecos) {
    return false;
  }

  if (restriccion.maxHuecos !== null && numHuecos > restriccion.maxHuecos) {
    return false;
  }

  return true;
}

/**
 * Obtiene el mensaje de error para cantidad de huecos inválida
 * @param tipo Tipo de nicho
 * @returns Mensaje de error descriptivo
 */
export function obtenerMensajeErrorHuecos(tipo: TipoNicho): string {
  const restriccion = RESTRICCIONES_TIPO_NICHO[tipo];
  
  if (!restriccion) {
    return 'Tipo de nicho no válido';
  }

  if (restriccion.maxHuecos === null) {
    return `${tipo} permite uno o más huecos (sin límite máximo)`;
  }

  if (restriccion.maxHuecos === 1) {
    return `${tipo} solo permite exactamente 1 hueco`;
  }

  return `${tipo} permite entre ${restriccion.minHuecos} y ${restriccion.maxHuecos} huecos`;
}

/**
 * Verifica si un tipo de nicho permite agregar más huecos
 * @param tipo Tipo de nicho
 * @param numHuecosActuales Cantidad actual de huecos del nicho
 * @returns true si se puede agregar más huecos, false si no
 */
export function puedeAgregarHuecos(
  tipo: TipoNicho,
  numHuecosActuales: number,
): boolean {
  const restriccion = RESTRICCIONES_TIPO_NICHO[tipo];
  
  if (!restriccion) {
    return false;
  }

  // Si no hay límite máximo, siempre se puede agregar
  if (restriccion.maxHuecos === null) {
    return true;
  }

  // Verificar si no se ha alcanzado el límite
  return numHuecosActuales < restriccion.maxHuecos;
}

/**
 * Obtiene el máximo de huecos permitidos para un tipo de nicho
 * @param tipo Tipo de nicho
 * @returns Número máximo de huecos o null si es ilimitado
 */
export function obtenerMaxHuecos(tipo: TipoNicho): number | null {
  const restriccion = RESTRICCIONES_TIPO_NICHO[tipo];
  return restriccion ? restriccion.maxHuecos : null;
}
