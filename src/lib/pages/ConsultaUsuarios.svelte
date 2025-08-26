<script lang="ts">
  import { onMount } from 'svelte';
  import ModalConfirmacion from '../components/ModalConfirmacion.svelte';
  import ErrorBanner from '../ui/ErrorBanner.svelte';
  import { fetchJSON, messageForUser, ensureItemsArray } from '../http';
  import { setPageTitle } from '../ui/title';

  type ApiRow = Record<string, any>;

  let filas: ApiRow[] = [];
  let encabezados: string[] = [];
  let busqueda = '';

  // Modal
  let mostrarConfirmacion = false;
  let filaSeleccionada: ApiRow | null = null;

  // Estados
  let cargando = true;
  let mensaje = '';
  let error = '';

  // Toast
  let avisoEliminacion = '';
  let mostrandoAviso = false;
  let avisoTimer: ReturnType<typeof setTimeout> | null = null;

  function mostrarAviso(texto: string) {
    avisoEliminacion = texto;
    mostrandoAviso = true;
    if (avisoTimer) clearTimeout(avisoTimer);
    avisoTimer = setTimeout(() => (mostrandoAviso = false), 3000);
  }

  onMount(async () => {
    setPageTitle('Consulta de Usuarios');
    await cargarUsuarios();
  });

  // helpers base
  function v2s(v: unknown): string {
    if (v === null || v === undefined) return '';
    if (typeof v === 'boolean') return v ? 'sí' : 'no';
    if (Array.isArray(v)) return (v as unknown[]).map(v2s).join(', ');
    if (typeof v === 'object') {
      try { return JSON.stringify(v); } catch { return String(v); }
    }
    return String(v);
  }

  function humanizeKey(k: string): string {
    const spaced = k.replace(/_/g, ' ')
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .toLowerCase();
    return spaced.replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function getId(row: ApiRow): number | string | undefined {
    const idKeys = ['id', 'ID', 'Id', 'user_id', 'pk'];
    for (const k of idKeys) {
      const v = row[k];
      if (typeof v === 'number' || typeof v === 'string') return v;
    }
    return undefined;
  }

  function getUsername(row: ApiRow): string | undefined {
    const keys = ['username', 'user_name', 'correo', 'email', 'nombre'];
    for (const k of keys) {
      const v = row[k];
      if (typeof v === 'string' && v.trim()) return v;
    }
    return undefined;
  }

  const userHeaderMap: Record<string, string> = {
    id: 'ID',
    username: 'Usuario',
    user_id: 'Usuario',
    user_name: 'Usuario',
    nombre: 'Nombre',
    email: 'Correo',
    correo: 'Correo',
    departamento: 'Departamento',
    dept: 'Departamento',
    activo: 'Activo',
    country: 'País',
    supervisor_user_id: 'Supervisor ID',
    supervisor_wfm: 'Supervisor',
    supervisor_wp_display_name: 'Supervisor',
    supervisor_email: 'Correo del supervisor',
    manager: 'Jefe',
    role: 'Rol'
  };

  function prettyUserHeader(key: string): string {
    return userHeaderMap[key.toLowerCase()] ?? humanizeKey(key);
  }

  function prettyUserCell(_key: string, value: unknown): string {
    return v2s(value);
  }

  function calcularEncabezados(data: ApiRow[]) {
    const set = new Set<string>();
    for (const r of data) Object.keys(r).forEach((k) => set.add(k));
    const prioridad = [
      'id','username','user_id','nombre','email','departamento',
      'activo','country','supervisor_user_id','supervisor_wfm'
    ];
    const resto = [...set].filter((k) => !prioridad.includes(k));
    encabezados = [...prioridad.filter((k) => set.has(k)), ...resto];
  }

  async function cargarUsuarios() {
    cargando = true; mensaje = ''; error = '';
    try {
      const data = await fetchJSON<unknown>('/api/usuarios', {}, { timeoutMs: 12000, ctx: '/api/usuarios' });
      filas = ensureItemsArray(data, '/api/usuarios') as ApiRow[];
      calcularEncabezados(filas);
      mensaje = filas.length
        ? `Usuarios cargados: ${filas.length}.`
        : 'No hay usuarios cargados todavía. Sube un CSV primero.';
    } catch (e) {
      error = messageForUser(e);
    } finally {
      cargando = false;
    }
  }

  // eliminar
  function confirmarEliminacion(fila: ApiRow) {
    filaSeleccionada = fila;
    mostrarConfirmacion = true;
  }

  async function eliminarSeleccionado() {
    if (!filaSeleccionada) return;
    try {
      const id = getId(filaSeleccionada);
      const user = getUsername(filaSeleccionada);

      if (id != null && id !== '') {
        const r = await fetch(`/api/usuarios/${encodeURIComponent(String(id))}`, { method: 'DELETE' });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
      } else if (user) {
        const r = await fetch(`/api/usuarios/by-username/${encodeURIComponent(user)}`, { method: 'DELETE' });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
      } else {
        throw new Error('No hay identificador (id/username/email) para borrar.');
      }

      const etiqueta = (filaSeleccionada['nombre'] ?? user ?? 'Registro') as string;
      filas = filas.filter((f) => f !== filaSeleccionada);
      mostrarAviso(`✅ ${etiqueta} eliminado correctamente.`);
      calcularEncabezados(filas);
    } catch (err: any) {
      mostrarAviso(`❌ Error al eliminar: ${err.message}`);
    } finally {
      filaSeleccionada = null;
      mostrarConfirmacion = false;
    }
  }

  // filtro
  $: filasFiltradas = filas.filter((fila) => {
    const texto = encabezados.map((h) => prettyUserCell(h, fila[h])).join(' ').toLowerCase();
    return texto.includes(busqueda.toLowerCase());
  });

  // helpers para el template
  function val(row: ApiRow, key: string): any { return row?.[key]; }
  function activo(row: ApiRow): boolean | undefined {
    const v = row?.['activo'];
    return typeof v === 'boolean' ? v : undefined;
  }
</script>

<div class="container my-3">
  <div class="d-flex align-items-center justify-content-between mb-3">
    <h2 class="h4 m-0">Consulta de Usuarios</h2>
    <button class="btn btn-outline-secondary btn-sm" on:click={cargarUsuarios} disabled={cargando} title="Actualizar">
      Recargar
    </button>
  </div>

  <div class="mb-3">
    <input type="text" placeholder="Buscar..." bind:value={busqueda} class="form-control form-control-sm" />
  </div>

  {#if cargando}
    <div class="d-flex align-items-center gap-2 text-primary mt-2">
      <div class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></div>
      <span class="small">Cargando usuarios...</span>
    </div>
  {/if}

  {#if error}
    <ErrorBanner message={error} on:retry={cargarUsuarios} />
  {/if}

  {#if mostrandoAviso}
    <div class="alert alert-success py-2 small" role="alert">
      {avisoEliminacion}
    </div>
  {/if}

  {#if !cargando && !error}
    {#if filasFiltradas.length > 0}
      <p class="text-success small mb-2">{mensaje}</p>

      <!-- Vista móvil: CARDS -->
      <div class="d-sm-none">
        {#each filasFiltradas as fila}
          <div class="card mb-2">
            <div class="card-body py-2">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <div class="fw-semibold">{val(fila,'nombre') || val(fila,'username') || val(fila,'user_id')}</div>
                  <div class="text-muted small">{val(fila,'email')}</div>
                </div>
                <button class="btn btn-link text-danger p-0 ms-2" on:click={() => confirmarEliminacion(fila)}>
                  Eliminar
                </button>
              </div>
              <div class="small mt-1">
                <span class="me-2">{val(fila,'departamento') || val(fila,'dept')}</span>
                <span class="text-muted">• {val(fila,'country')}</span>
                {#if typeof activo(fila) !== 'undefined'}
                  <span class={`badge ${activo(fila) ? 'bg-success' : 'bg-secondary'} ms-2`}>
                    {activo(fila) ? 'Activo' : 'Inactivo'}
                  </span>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>

      <!-- Vista tablet/escritorio: TABLA sin scroll horizontal -->
      <div class="d-none d-sm-block">
        <div class="table-wrap rounded border">
          <table class="table table-sm table-striped table-hover align-middle mb-0">
            <thead class="table-light sticky-head">
              <tr>
                {#each encabezados as header}
                  <th scope="col">{prettyUserHeader(header)}</th>
                {/each}
                <th scope="col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {#each filasFiltradas as fila}
                <tr>
                  {#each encabezados as h}
                    <td>{prettyUserCell(h, fila[h])}</td>
                  {/each}
                  <td class="text-nowrap">
                    <button class="btn btn-link text-danger p-0" on:click={() => confirmarEliminacion(fila)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {:else}
      <p class="text-muted">{mensaje}</p>
    {/if}
  {/if}

  {#if mostrarConfirmacion}
    <ModalConfirmacion
      mensaje="¿Estás seguro de que deseas eliminar este usuario?"
      on:confirmar={eliminarSeleccionado}
      on:cancelar={() => { filaSeleccionada = null; mostrarConfirmacion = false; }}
    />
  {/if}
</div>

<style>
  /* Encabezado pegajoso dentro de la tabla */
  .sticky-head { position: sticky; top: 0; z-index: 1; }

  /* --- Evitar scroll horizontal y mantener layout limpio --- */
  .table-wrap { max-width: 100%; overflow-x: clip; }
  .table-wrap .table { width: 100%; table-layout: fixed; border-collapse: separate; }

  .table-wrap .table th,
  .table-wrap .table td {
    white-space: normal;        /* permite wrap */
    overflow-wrap: anywhere;    /* rompe palabras largas */
    word-break: break-word;
    hyphens: auto;
    vertical-align: middle;
    padding: 0.55rem 0.7rem;
  }

  /* Reservar poco espacio para columnas cortas (ej. ID) */
  .table-wrap .table th:nth-child(1),
  .table-wrap .table td:nth-child(1) { width: 64px; }

  /* Evitar cortes raros en columna Acciones */
  .table-wrap .table td:last-child { white-space: nowrap; }
</style>