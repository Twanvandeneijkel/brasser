<script lang="ts">
	import { resolve } from '$app/paths';
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';

	let { children, data } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="description" content="Brassers voorraad, recepten en voedingswaarden" />
</svelte:head>

<header class="site-header">
	<a class="brand" href={resolve('/')}>Brassers</a>
	<nav aria-label="Hoofdnavigatie">
		<a href={resolve('/')}>Start</a>
		{#if data.user}
			<a href={resolve('/stock')}>Voorraad</a>
			<a href={resolve('/recipes')}>Recepten &amp; grondstoffen</a>
			<a href={resolve('/nutritional-values')}>Voedingswaarden</a>
			<span class="user-status"
				>{data.user.name ?? data.user.username} · {data.user.role === 'admin'
					? 'Beheerder'
					: 'Gebruiker'}</span
			>
			<form method="POST" action="/logout">
				<button class="link-button" type="submit">Uitloggen</button>
			</form>
		{:else}
			<a href={resolve('/login')}>Inloggen</a>
		{/if}
	</nav>
</header>

<main class="container">
	{#if data.flash}<div
			class:success={data.flash.type === 'success'}
			class:error={data.flash.type === 'error'}
			class:warning={data.flash.type === 'warning'}
			class="alert"
			role="status"
		>
			{data.flash.message}
		</div>{/if}
	{@render children()}
</main>

<footer class="site-footer">
	Veilig voorraad- en voedingswaardenbeheer met SvelteKit en Prisma.
</footer>
