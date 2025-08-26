<script lang="ts">
  import { onMount } from 'svelte';
  import { setPageTitle } from '../ui/title';
  export let path = '';
  onMount(() => setPageTitle('404'));
</script>

<div class="p-4 text-center">
  <h1 class="h4 fw-bold mb-2">404 - Página no encontrada</h1>
  <p class="text-muted mb-3">La ruta <code>{path}</code> no existe.</p>
  <a href="#/usuarios" class="link-primary">Ir a Usuarios</a>
</div>