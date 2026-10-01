/**
 * Acceso seguro y resiliente a LocalStorage con memoria en caché de respaldo.
 * Protege contra errores de DOMException / SecurityError cuando la app
 * se ejecuta dentro de un iframe, ventana de preview de AI Studio,
 * o navegadores en modo incógnito/restringido.
 */

const memoryCache = new Map<string, string>();

export function safeGetStorage(key: string, fallback: string | null = null): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const val = window.localStorage.getItem(key);
      if (val !== null) return val;
    }
  } catch (e) {
    // Si localStorage no está disponible o está bloqueado por el iframe
  }
  return memoryCache.has(key) ? (memoryCache.get(key) ?? null) : fallback;
}

export function safeSetStorage(key: string, value: string): boolean {
  memoryCache.set(key, value);
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
      return true;
    }
  } catch (e) {
    // No se pudo persistir en disco, pero queda en memoria durante la sesión
  }
  return false;
}

export function safeRemoveStorage(key: string): boolean {
  memoryCache.delete(key);
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
      return true;
    }
  } catch (e) {
    // Silencioso
  }
  return false;
}
