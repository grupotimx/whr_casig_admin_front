<script lang="ts">
  import { onMount } from 'svelte';
  import { setPageTitle } from '../ui/title';
  onMount(() => setPageTitle('Inicio'));
</script>

<div class="container py-4">
  <h1 class="h4 mb-4">Bienvenido</h1>

  <div class="row g-3">
    <div class="col-12 col-md-4">
      <a href="#/carga" class="text-decoration-none">
        <div class="card h-100 shadow-sm">
          <div class="card-body">
            <h2 class="h5 mb-2">Subir CSV</h2>
            <p class="text-muted mb-0">Carga usuarios o dispositivos desde archivo.</p>
          </div>
        </div>
      </a>
    </div>

    <div class="col-12 col-md-4">
      <a href="#/usuarios" class="text-decoration-none">
        <div class="card h-100 shadow-sm">
          <div class="card-body">
            <h2 class="h5 mb-2">Ver Usuarios</h2>
            <p class="text-muted mb-0">Consulta, filtra y elimina registros de usuarios.</p>
          </div>
        </div>
      </a>
    </div>

    <div class="col-12 col-md-4">
      <a href="#/dispositivos" class="text-decoration-none">
        <div class="card h-100 shadow-sm">
          <div class="card-body">
            <h2 class="h5 mb-2">Ver Dispositivos</h2>
            <p class="text-muted mb-0">Consulta, filtra y elimina registros de inventario.</p>
          </div>
        </div>
      </a>
    </div>
  </div>
</div>