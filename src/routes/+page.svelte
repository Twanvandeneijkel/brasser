<script lang="ts">
	import { resolve } from '$app/paths';
	let { data } = $props();
</script>

<svelte:head><title>Brassers winkeltool</title></svelte:head>

<section class="hero">
	<p class="eyebrow">Bakery operations</p>
	<h1>Van winkelvoorraad naar een helder productieadvies.</h1>
	<p>
		Beheer producten, gewichten, recepten en voedingswaarden vanuit één veilige omgeving. De
		Excel-export blijft daarnaast zelfstandig bruikbaar.
	</p>
	<div class="actions">
		{#if data.user}
			<a class="button" href={resolve('/stock')}>Open voorraad</a>
			<a class="button secondary" href={resolve('/recipes')}>Open recepten</a>
			<a class="button secondary" href={resolve('/nutritional-values')}>Bereken voedingswaarden</a>
		{:else}
			<a class="button" href={resolve('/login')}>Inloggen</a>
		{/if}
	</div>
</section>

<section class="card-grid" aria-label="Functies">
	<article class="feature-card">
		<h2>Voorraad</h2>
		<p>
			Registreer wat er live in het vak ligt en bereken automatisch hoeveel er geproduceerd moet
			worden.
		</p>
	</article>
	<article class="feature-card">
		<h2>Recepten</h2>
		<p>Koppel grondstoffen aan iedere productvariant en bereken de voedingswaarden per 100 gram.</p>
	</article>
	<article class="feature-card">
		<h2>Excel</h2>
		<p>
			Download altijd een actuele, zelfstandige kopie met formules en kopieerbare etiketteksten.
		</p>
	</article>
</section>
