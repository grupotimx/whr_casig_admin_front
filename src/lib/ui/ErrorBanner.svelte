<script lang="ts">
  export let message = 'Ocurrió un error';
  export let retry: (() => void) | null = null;
  // si usas on:retry desde el padre:
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
</script>

<div class="alert alert-danger d-flex justify-content-between align-items-center" role="alert">
  <div class="me-3">{message}</div>
  <button
    class="btn btn-outline-danger btn-sm"
    on:click={() => (retry ? retry() : dispatch('retry'))}
  >
    Reintentar
  </button>
</div>