<script lang="ts">
  const UPLOAD_URL = '/api/upload-csv/';

  let file: File | null = null;

  let subiendo = false;
  let okMsg = '';
  let errMsg = '';

  function triggerFilePicker() {
    const el = document.getElementById('csvInput') as HTMLInputElement | null;
    el?.click();
  }

  function onChoose(e: Event) {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0] ?? null;

    okMsg = '';
    errMsg = '';

    if (f && !f.name.toLowerCase().endsWith('.csv')) {
      errMsg = 'Solo se permiten archivos .csv';
      file = null;
      input.value = '';
      return;
    }
    file = f;
  }

  async function subir() {
    okMsg = '';
    errMsg = '';

    if (!file) {
      errMsg = 'Selecciona un CSV primero.';
      return;
    }

    try {
      subiendo = true;

      const fd = new FormData();
      fd.append('file', file, file.name);

      const res = await fetch(UPLOAD_URL, { method: 'POST', body: fd });

      let data: any = null;
      try { data = await res.json(); } catch {}

      if (!res.ok) {
        const detalle = data?.detail ?? data?.message ?? `HTTP ${res.status}`;
        throw new Error(String(detalle));
      }

      const count = data?.count ?? data?.items?.length;
      const backendMsg = data?.message;

      okMsg = backendMsg
        ? backendMsg
        : (typeof count === 'number'
            ? `CSV cargado correctamente (${count} registros).`
            : 'CSV cargado correctamente.');

      file = null;
      const input = document.getElementById('csvInput') as HTMLInputElement | null;
      if (input) input.value = '';
    } catch (e: any) {
      errMsg = e?.message ?? 'Error al subir el CSV.';
    } finally {
      subiendo = false;
    }
  }
</script>

<div class="container py-4">
  <div class="row justify-content-center">
    <div class="col-12 col-md-10 col-lg-6">
      <div class="card shadow-sm">
        <div class="card-body p-4">
          <h1 class="h3 fw-bold mb-4 text-center">Subir archivo CSV</h1>

          <input
            id="csvInput"
            class="d-none"
            type="file"
            accept=".csv,text/csv"
            on:change={onChoose}
          />

          <div class="d-grid gap-2 mb-2">
            <button
              type="button"
              class="btn btn-outline-secondary"
              on:click={triggerFilePicker}
            >
              Seleccionar archivo
            </button>
          </div>

          <!-- Aquí mostramos el nombre del archivo si hay uno -->
          {#if file}
            <p class="text-muted small mb-3">
              Archivo seleccionado: <strong>{file.name}</strong>
            </p>
          {/if}

          <div class="d-grid">
            <button
              class="btn btn-primary"
              on:click={subir}
              disabled={subiendo}
            >
              {#if subiendo}
                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Subiendo…
              {:else}
                Enviar
              {/if}
            </button>
          </div>

          {#if okMsg}
            <div class="alert alert-success mt-3" role="alert">{okMsg}</div>
          {/if}

          {#if errMsg}
            <div class="alert alert-danger mt-3 d-flex justify-content-between align-items-start" role="alert">
              <span>{errMsg}</span>
              <button
                type="button"
                class="btn btn-sm btn-outline-danger"
                on:click={subir}
                disabled={subiendo}
              >
                Reintentar
              </button>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>