<script lang="ts">
	let { form } = $props();
</script>

<svelte:head><title>Inloggen | Brassers</title></svelte:head>

<section class="form-card narrow">
	<p class="eyebrow">Beveiligde toegang</p>
	<h1>Inloggen</h1>
	<p>Gebruik het winkelaccount of beheerdersaccount.</p>
	{#if form?.error}<div class="alert error" role="alert">{form.error}</div>{/if}
	<form method="POST">
		<label for="username">Gebruikersnaam</label>
		<input id="username" name="username" autocomplete="username" maxlength="100" required />
		<label for="password">Wachtwoord</label>
		<input
			id="password"
			name="password"
			type="password"
			autocomplete="current-password"
			maxlength="256"
			required
		/>
		<button class="button full" type="submit">Inloggen</button>
	</form>
	<p class="form-note">Sessies worden uitsluitend opgeslagen in een beveiligde HttpOnly-cookie.</p>
</section>
