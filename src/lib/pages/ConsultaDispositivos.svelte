<script lang="ts">
  import { onMount } from 'svelte';
  import ModalConfirmacion from '../components/ModalConfirmacion.svelte';
  import ErrorBanner from '../ui/ErrorBanner.svelte';
  import { fetchJSON, messageForUser, ensureItemsArray } from '../http';
  import { setPageTitle } from '../ui/title';

  type ApiRow = Record<string, any>;

  let filas: ApiRow[] = [];
  let encabezados: string[] = [];

  // Paginación
  let paginaActual = 1;
  const porPagina = 100;

  // Orden por defecto
  let sortKey: string = 'id';
  let sortAsc: boolean = true;

  // Buscador (debounce + índice)
  let busqueda = '';
  let busquedaDebounced = '';
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let indexText: string[] = [];

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
    setPageTitle('Consulta de Dispositivos');
    await cargarDispositivos();
  });

  // Helpers
  function v2s(v: unknown): string {
    if (v === null || v === undefined) return '';
    if (typeof v === 'boolean') return v ? 'sí' : 'no';
    if (Array.isArray(v)) return v.map(v2s).join(', ');
    if (typeof v === 'object') {
      try { return JSON.stringify(v); } catch { return String(v); }
    }
    return String(v);
  }

  function humanizeKey(k: string): string {
    const spaced = k
      .replace(/_/g, ' ')
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .toLowerCase();
    return spaced.replace(/\b\w/g, (c) => c.toUpperCase());
  }

  const headerMap: Record<string, string> = {
    contract_id: 'Contrato',
    maturity_date: 'Fecha de vencimiento',
    device_status: 'Estado'
  };

  const statusMap: Record<string, string> = {
    active: 'Activo',
    inactive: 'Inactivo',
    retired: 'Retirado',
    maintenance: 'Mantenimiento',
    'in repair': 'En reparación',
    in_repair: 'En reparación',
    lost: 'Perdido'
  };

  function prettyHeader(key: string): string {
    return headerMap[key] ?? humanizeKey(key);
  }

  function formatDateES(v: unknown): string {
    const s = v2s(v);
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
    }
    return s;
  }

  function prettyCell(key: string, value: unknown): string {
    if (key === 'maturity_date') return formatDateES(value);
    if (key === 'device_status') {
      const raw = v2s(value).toLowerCase().trim();
      return statusMap[raw] ?? v2s(value);
    }
    return v2s(value);
  }

  function getId(row: ApiRow): number | string | undefined {
    const idKeys = ['id', 'ID', 'Id', 'device_id', 'user_id', 'pk'];
    for (const k of idKeys) {
      const v = row[k];
      if (typeof v === 'number' || typeof v === 'string') return v;
    }
    return undefined;
  }

  function getTag(row: ApiRow): string | undefined {
    const tagKeys = ['tag', 'asset_tag', 'codigo', 'clave', 'serie', 'serial'];
    for (const k of tagKeys) {
      const v = row[k];
      if (typeof v === 'string' && v.trim()) return v;
    }
    return undefined;
  }

  function calcularEncabezados(data: ApiRow[]) {
    const set = new Set<string>();
    for (const r of data) Object.keys(r).forEach((k) => set.add(k));
    const prioridad = [
      'id','tag','asset_tag','nombre','serie','tipo','device_type','activo',
      'contract_id','maturity_date','device_status'
    ];
    const resto = [...set].filter((k) => !prioridad.includes(k));
    encabezados = [...prioridad.filter((k) => set.has(k)), ...resto];
  }

  async function cargarDispositivos() {
    cargando = true; error = '';
    try {
      const data = await fetchJSON<unknown>('/api/dispositivos', {}, { timeoutMs: 12000, ctx: '/api/dispositivos' });
      filas = ensureItemsArray(data, '/api/dispositivos');
      calcularEncabezados(filas);
      mensaje = filas.length
        ? `Dispositivos cargados: ${filas.length}.`
        : 'No hay dispositivos cargados todavía.';
      paginaActual = 1;
    } catch (e) {
      error = messageForUser(e);
    } finally {
      cargando = false;
    }
  }

  // --- Borrado ---
  function confirmarEliminacion(fila: ApiRow) {
    filaSeleccionada = fila;
    mostrarConfirmacion = true;
  }

  async function eliminarSeleccionado() {
    if (!filaSeleccionada) return;
    try {
      const id = getId(filaSeleccionada);
      const tag = getTag(filaSeleccionada);

      if (id != null && id !== '') {
        const r = await fetch(`/api/dispositivos/${encodeURIComponent(String(id))}`, { method: 'DELETE' });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
      } else if (tag) {
        const r = await fetch(`/api/dispositivos/by-tag/${encodeURIComponent(tag)}`, { method: 'DELETE' });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
      } else {
        throw new Error('No hay identificador válido para borrar.');
      }

      const etiqueta = (filaSeleccionada['nombre'] ?? filaSeleccionada['serie'] ?? tag ?? 'Registro') as string;
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

  function cancelarEliminacion() {
    mostrarConfirmacion = false;
    filaSeleccionada = null;
  }

  // --- Buscador ---
  function onBuscar(e: Event) {
    const valor = (e.target as HTMLInputElement).value;
    busqueda = valor;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      busquedaDebounced = valor.toLowerCase();
      paginaActual = 1;
    }, 220);
  }

  $: indexText =
    filas.length && encabezados.length
      ? filas.map((fila) => encabezados.map((h) => prettyCell(h, fila[h])).join(' ').toLowerCase())
      : [];

  $: filasFiltradas =
    !busquedaDebounced
      ? filas
      : filas.filter((_, i) => indexText[i]?.includes(busquedaDebounced));

  // --- Orden natural ---
  function valueForSort(row: ApiRow, key: string): any {
    const v = row[key];
    if (typeof v === 'number') return v;
    if (key === 'maturity_date') {
      const d = new Date(v2s(v));
      return isNaN(d.getTime()) ? Number.NEGATIVE_INFINITY : d.getTime();
    }
    const s = v2s(v).trim();
    if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
    const m = s.match(/(\d+)\s*$/);
    if (m) return Number(m[1]);
    return s.toLowerCase();
  }

  $: filasOrdenadas = [...filasFiltradas].sort((a, b) => {
    const va = valueForSort(a, sortKey);
    const vb = valueForSort(b, sortKey);
    if (va < vb) return sortAsc ? -1 : 1;
    if (va > vb) return sortAsc ? 1 : -1;
    return 0;
  });

  // Paginación
  $: totalPaginas = Math.max(1, Math.ceil(filasOrdenadas.length / porPagina));
  $: filasPaginadas = filasOrdenadas.slice(
    (paginaActual - 1) * porPagina,
    paginaActual * porPagina
  );
</script>

<div class="container my-4 page-wrap">
  <div class="card shadow-sm">
    <div class="card-body">
      <div class="d-flex align-items-center justify-content-between mb-3">
        <h2 class="h5 m-0">Consulta de Dispositivos</h2>
        <button class="btn btn-outline-secondary btn-sm"
          on:click={cargarDispositivos} disabled={cargando} title="Actualizar">
          Recargar
        </button>
      </div>

      <input
        type="text"
        placeholder="Buscar..."
        value={busqueda}
        on:input={onBuscar}
        class="form-control form-control-sm mb-3"
      />

      {#if cargando}
        <div class="d-flex align-items-center gap-2 text-primary mt-2">
          <div class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></div>
          <span class="small">Cargando dispositivos...</span>
        </div>
      {/if}

      {#if error}
        <ErrorBanner message={error} on:retry={cargarDispositivos} />
      {/if}

      {#if mostrandoAviso}
        <div class="alert alert-success py-2 small mb-2" role="alert">
          {avisoEliminacion}
        </div>
      {/if}

      {#if !cargando && !error}
        {#if filasPaginadas.length > 0}
          <p class="text-success small mb-2">{mensaje}</p>

          <!-- Vista móvil: CARDS -->
          <div class="d-sm-none">
            {#each filasPaginadas as fila}
              <div class="card mb-2">
                <div class="card-body py-2">
                  <div class="d-flex justify-content-between align-items-start">
                    <div>
                      <div class="fw-semibold">{fila['nombre'] || fila['asset_description'] || 'Dispositivo'}</div>
                      <div class="small text-muted">
                        Serie: {fila['serie'] || fila['asset_serial_number']}
                        {#if fila['asset_tag']} • Tag: {fila['asset_tag']}{/if}
                      </div>
                    </div>
                    <button class="btn btn-link text-danger p-0 ms-2" on:click={() => confirmarEliminacion(fila)}>
                      Eliminar
                    </button>
                  </div>
                  <div class="small mt-1">
                    {#if fila['maturity_date']}
                      <span class="me-2">Vence: {formatDateES(fila['maturity_date'])}</span>
                    {/if}
                    {#if fila['device_status'] || fila['estado']}
                      <span class="badge bg-secondary">{prettyCell('device_status', fila['device_status'] || fila['estado'])}</span>
                    {/if}
                  </div>
                </div>
              </div>
            {/each}
          </div>

          <!-- Vista tablet/escritorio: TABLA (sin scroll horizontal; celdas con wrap) -->
          <div class="d-none d-sm-block">
            <div class="table-wrap">
              <table class="table table-sm table-striped table-hover align-middle mb-0">
                <thead class="table-light sticky-head">
                  <tr>
                    {#each encabezados as header}
                      <th
                        scope="col"
                        class="text-uppercase small"
                        on:click={() => {
                          if (sortKey === header) { sortAsc = !sortAsc; }
                          else { sortKey = header; sortAsc = true; }
                          paginaActual = 1;
                        }}
                        style="cursor:pointer; user-select:none;"
                        title={`Ordenar por ${prettyHeader(header)} (${sortKey===header ? (sortAsc?'asc':'desc') : 'asc'})`}
                      >
                        {prettyHeader(header)}
                        {#if sortKey === header}
                          <span class="ms-1 small">{sortAsc ? '▲' : '▼'}</span>
                        {/if}
                      </th>
                    {/each}
                    <th scope="col" class="text-uppercase small">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {#each filasPaginadas as fila}
                    <tr>
                      {#each encabezados as h}
                        <td>{prettyCell(h, fila[h])}</td>
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

              <div class="d-flex justify-content-center align-items-center gap-3 mt-3">
                <button
                  on:click={() => paginaActual = Math.max(1, paginaActual - 1)}
                  disabled={paginaActual === 1}
                  class="btn btn-light btn-sm"
                >
                  ← Anterior
                </button>
                <span class="small">Página {paginaActual} de {totalPaginas}</span>
                <button
                  on:click={() => paginaActual = Math.min(totalPaginas, paginaActual + 1)}
                  disabled={paginaActual === totalPaginas}
                  class="btn btn-light btn-sm"
                >
                  Siguiente →
                </button>
              </div>
            </div>
          </div>
        {:else}
          <p class="text-muted">{mensaje}</p>
        {/if}
      {/if}

      {#if mostrarConfirmacion}
        <ModalConfirmacion
          mensaje="¿Estás seguro de que deseas eliminar este dispositivo?"
          on:confirmar={eliminarSeleccionado}
          on:cancelar={cancelarEliminacion}
        />
      {/if}
    </div>
  </div>
</div>

<style>
  /* Centro y limito el ancho del contenido */
  .page-wrap { max-width: 1140px; }

  /* Encabezado de la tabla “pegajoso” cuando hay scroll vertical */
  .sticky-head { position: sticky; top: 0; z-index: 1; }

  /* --- Mejora anti-scroll horizontal --- */
  .table-wrap {
    max-width: 100%;
    overflow-x: clip;            /* evita que sobresalga sin barra */
  }
  .table-wrap .table {
    width: 100%;
    table-layout: fixed;         /* reparte ancho, no crece más del contenedor */
    border-collapse: separate;
  }
  .table-wrap .table th,
  .table-wrap .table td {
    white-space: normal;         /* permite saltos de línea */
    overflow-wrap: anywhere;     /* rompe palabras largas si hace falta */
    word-break: break-word;
    hyphens: auto;
    vertical-align: middle;
    padding: 0.55rem 0.7rem;
  }

  /* Da menos espacio a columnas usualmente cortas (ID, ACTIVO aprox.) */
  .table-wrap .table th:nth-child(1),
  .table-wrap .table td:nth-child(1) { width: 64px; }

  /* Haz que la columna de “nombre/descr.” no empuje todo (ajusta índice si quieres otro) */
  .table-wrap .table th:nth-child(3),
  .table-wrap .table td:nth-child(3) { max-width: 320px; }

  /* Evita que el contenido de la última columna se parta (acciones) */
  .table-wrap .table td:last-child { white-space: nowrap; }
</style>