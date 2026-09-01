const isDev = import.meta.env.DEV;

export function logError(context, error) {
  if (isDev) {
    console.error(`[${context}]`, error);
  }
  // En producción: silencioso. Futuro: enviar a servicio de error reporting.
}

export function logWarn(context, message) {
  if (isDev) {
    console.warn(`[${context}]`, message);
  }
}
