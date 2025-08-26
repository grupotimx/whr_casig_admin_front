<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let mensaje: string = '';

  const dispatch = createEventDispatcher();

  function confirmar() {
    dispatch('confirmar');
  }

  function cancelar() {
    dispatch('cancelar');
  }
</script>

<div class="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
  <div class="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
    <h2 class="text-xl font-semibold text-gray-800 mb-4">Confirmación</h2>
    <p class="text-gray-700 mb-6">{mensaje}</p>
    <div class="flex justify-end gap-4">
      <button
        class="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 text-gray-800"
        on:click={cancelar}
      >
        Cancelar
      </button>
      <button
        class="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white"
        on:click={confirmar}
      >
        Confirmar
      </button>
    </div>
  </div>
</div>