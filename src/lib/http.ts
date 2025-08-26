// src/lib/http.ts
export type HttpErrorKind =
  | 'network'
  | 'timeout'
  | 'http4xx'
  | 'http5xx'
  | 'parse'
  | 'unknown';

export class HttpError extends Error {
  kind: HttpErrorKind;
  status?: number;
  ctx?: string; // contexto opcional (p. ej. la ruta)
  constructor(message: string, kind: HttpErrorKind, status?: number, ctx?: string) {
    super(message);
    this.kind = kind;
    this.status = status;
    this.ctx = ctx;
  }
}

/**
 * fetchJSON: hace fetch con timeout, valida HTTP ok y parsea JSON.
 * Lanza HttpError con kind: network | timeout | http4xx | http5xx | parse
 */
export async function fetchJSON<T>(
  input: RequestInfo,
  init?: RequestInit,
  opts?: { timeoutMs?: number; ctx?: string }
): Promise<T> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), opts?.timeoutMs ?? 12000);

  let res: Response;
  try {
    res = await fetch(input, { ...init, signal: controller.signal });
  } catch (e: any) {
    clearTimeout(id);
    if (e?.name === 'AbortError') {
      throw new HttpError('Tiempo de espera agotado', 'timeout', undefined, opts?.ctx);
    }
    throw new HttpError('No hay conexión con el servidor', 'network', undefined, opts?.ctx);
  } finally {
    clearTimeout(id);
  }

  if (!res.ok) {
    const kind: HttpErrorKind =
      res.status >= 500 ? 'http5xx' :
      res.status >= 400 ? 'http4xx' : 'unknown';
    throw new HttpError(`HTTP ${res.status}`, kind, res.status, opts?.ctx);
  }

  try {
    return (await res.json()) as T;
  } catch {
    throw new HttpError('Respuesta inválida del servidor', 'parse', undefined, opts?.ctx);
  }
}

/**
 * ensureItemsArray: valida que el objeto tenga { items: [] }.
 * Si no cumple, lanza HttpError 'parse' con un mensaje claro.
 */
export function ensureItemsArray<T = unknown>(
  data: any,
  ctx?: string
): T[] {
  if (!data || typeof data !== 'object' || !Array.isArray(data.items)) {
    throw new HttpError('Formato inesperado: se esperaba { items: [...] }', 'parse', undefined, ctx);
  }
  return data.items as T[];
}

/** Mensaje amigable en español según el tipo de error */
export function messageForUser(err: unknown): string {
  if (err instanceof HttpError) {
    switch (err.kind) {
      case 'network':
        return 'No se pudo conectar con el servidor. Verifica que el backend esté en línea.';
      case 'timeout':
        return 'La solicitud tardó demasiado. Intenta de nuevo.';
      case 'http4xx':
        if (err.status === 401) return 'No autorizado (401). Inicia sesión o solicita acceso.';
        if (err.status === 403) return 'Acceso denegado (403).';
        if (err.status === 404) return 'Recurso no encontrado (404).';
        return 'Hubo un problema con la solicitud (HTTP 4xx).';
      case 'http5xx':
        return 'El servidor presentó un problema (HTTP 5xx). Intenta más tarde.';
      case 'parse':
        return 'El servidor respondió con un formato inesperado.';
      default:
        return 'Ocurrió un error inesperado.';
    }
  }
  return 'Ocurrió un error inesperado.';
}