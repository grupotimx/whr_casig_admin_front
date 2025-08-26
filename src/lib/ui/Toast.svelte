<script lang="ts"> export let kind:'success'|'error'='success'; </script>
<div class={`text-sm rounded px-3 py-2 border ${kind==='success'
  ? 'text-green-700 bg-green-50 border-green-200'
  : 'text-red-700 bg-red-50 border-red-200'}`}>
  <slot />
</div>