<script lang="ts">
  import Router from 'svelte-spa-router';
  import routes from './lib/routes';
</script>

<!-- Header mínimo como tu versión original -->
<div class="bg-light border-bottom">
  <nav class="container py-2 d-flex gap-3 small">
    <a class="text-decoration-none" href="#/">Inicio</a>
    <a class="text-decoration-none" href="#/carga">Subir CSV</a>
    <a class="text-decoration-none" href="#/usuarios">Ver Usuarios</a>
    <a class="text-decoration-none" href="#/dispositivos">Ver Dispositivos</a>
  </nav>
</div>

<main class="container py-3">
  <Router {routes} />
</main>