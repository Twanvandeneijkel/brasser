<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
</script>

<svelte:head><title>Fout | Brassers</title></svelte:head>
<section class="empty-state">
	<p class="eyebrow">Fout {page.status}</p>
	<h1>{page.status === 404 ? 'Pagina niet gevonden' : 'Er ging iets mis'}</h1>
	<p>{page.error?.message}</p>
	{#if page.error?.requestId}<small>Referentie: {page.error.requestId}</small>{/if}
	<div class="actions"><a class="button" href={resolve('/')}>Naar start</a></div>
</section>
