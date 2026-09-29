<script lang="ts">
	let { form } = $props();
	let copyStatus = $state('');
	async function copyResult() {
		if (!form?.result) return;
		try {
			await navigator.clipboard.writeText(form.result.label);
			copyStatus = 'Gekopieerd.';
		} catch {
			copyStatus = 'Selecteer de tekst en kopieer handmatig.';
		}
	}
</script>

<svelte:head><title>Voedingswaarden | Brassers</title></svelte:head>

<header class="page-heading">
	<div>
		<p class="eyebrow">Standaardberekening</p>
		<h1>Voedingswaarden berekenen</h1>
		<p>Bereken energie en portiewaarden vanuit de macronutriënten per 100 gram.</p>
	</div>
</header>

<section class="form-card">
	<form method="POST" class="form-grid">
		<div class="wide">
			<label for="productName">Productnaam</label><input
				id="productName"
				name="productName"
				value={form?.values?.productName ?? ''}
				required
			/>
		</div>
		<div>
			<label for="portionGrams">Portie (g)</label><input
				id="portionGrams"
				name="portionGrams"
				type="number"
				min="0.01"
				step="0.01"
				value={form?.values?.portionGrams ?? 100}
				required
			/>
		</div>
		<div>
			<label for="fat">Vet (g)</label><input
				id="fat"
				name="fat"
				type="number"
				min="0"
				step="0.01"
				value={form?.values?.fat ?? 0}
				required
			/>
		</div>
		<div>
			<label for="saturates">Verzadigd (g)</label><input
				id="saturates"
				name="saturates"
				type="number"
				min="0"
				step="0.01"
				value={form?.values?.saturates ?? 0}
				required
			/>
		</div>
		<div>
			<label for="carbohydrates">Koolhydraten (g)</label><input
				id="carbohydrates"
				name="carbohydrates"
				type="number"
				min="0"
				step="0.01"
				value={form?.values?.carbohydrates ?? 0}
				required
			/>
		</div>
		<div>
			<label for="sugars">Suikers (g)</label><input
				id="sugars"
				name="sugars"
				type="number"
				min="0"
				step="0.01"
				value={form?.values?.sugars ?? 0}
				required
			/>
		</div>
		<div>
			<label for="protein">Eiwit (g)</label><input
				id="protein"
				name="protein"
				type="number"
				min="0"
				step="0.01"
				value={form?.values?.protein ?? 0}
				required
			/>
		</div>
		<div>
			<label for="salt">Zout (g)</label><input
				id="salt"
				name="salt"
				type="number"
				min="0"
				step="0.001"
				value={form?.values?.salt ?? 0}
				required
			/>
		</div>
		<div class="wide"><button class="button" type="submit">Berekenen</button></div>
	</form>
	{#if form?.errors}<div class="alert error">
			<ul>
				{#each Object.values(form.errors).flat() as message, index (`${index}-${message}`)}<li>
						{message}
					</li>{/each}
			</ul>
		</div>{/if}
</section>

{#if form?.result}
	<section class="result-card">
		<div class="copy-heading">
			<h2>Kopieerbare tekst</h2>
			<button class="button small" type="button" onclick={copyResult}>Kopiëren</button>
		</div>
		<textarea class="label-output" readonly value={form.result.label}></textarea>{#if copyStatus}<p
				class="form-note"
			>
				{copyStatus}
			</p>{/if}
	</section>
{/if}
