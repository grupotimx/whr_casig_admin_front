<script lang="ts">
  export let label: string = 'Cargando...';
</script>

<div class="d-flex align-items-center gap-2 text-primary mt-2">
  <div class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></div>
  <span class="small">{label}</span>
</div>