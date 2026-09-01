const isDev = import.meta.env.DEV;

// Buffer de errores en producción (para futuro envío a servicio de reporting)
const errorBuffer = [];
const MAX_BUFFER = 50;

function buildEntry(level, context, data) {
  return {
    level,
    context,
    message: data instanceof Error ? data.message : String(data ?? ''),
    timestamp: Date.now(),
    url: typeof location !== 'undefined' ? location.pathname : '',
    online: typeof navigator !== 'undefined' ? navigator.onLine : true,
  };
}

export function logError(context, error) {
  const entry = buildEntry('error', context, error);

  if (isDev) {
    console.error(`[${context}]`, error);
  }

  // Almacenar en buffer para diagnóstico (accesible desde consola en prod)
  errorBuffer.push(entry);
  if (errorBuffer.length > MAX_BUFFER) errorBuffer.shift();
}

export function logWarn(context, message) {
  if (isDev) {
    console.warn(`[${context}]`, message);
  }
}

// Medir latencia de operaciones async
export async function withTiming(context, fn) {
  const start = performance.now();
  try {
    const result = await fn();
    const ms = Math.round(performance.now() - start);
    if (isDev && ms > 500) {
      console.warn(`[perf:${context}] ${ms}ms`);
    }
    return result;
  } catch (error) {
    const ms = Math.round(performance.now() - start);
    logError(`${context} (${ms}ms)`, error);
    throw error;
  }
}

// Accesible desde consola del navegador: window.__gymratErrors
if (typeof window !== 'undefined') {
  window.__gymratErrors = errorBuffer;
}
