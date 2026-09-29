<script lang="ts">
	import { resolve } from '$app/paths';
	let { data, form } = $props();
	let copyStatus = $state('');
	const weight = (grams: number) =>
		grams < 1000
			? `${grams} g`
			: `${new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 2 }).format(grams / 1000)} kg`;
	async function copyText(value: string) {
		try {
			await navigator.clipboard.writeText(value);
			copyStatus = 'De complete voedingswaardetekst is gekopieerd.';
		} catch {
			copyStatus = 'Kopiëren is niet gelukt; selecteer de tekst handmatig.';
		}
	}
</script>

<svelte:head><title>Recepten en grondstoffen | Brassers</title></svelte:head>

<header class="page-heading">
	<div>
		<p class="eyebrow">Productberekening</p>
		<h1>Recepten &amp; grondstoffen</h1>
		<p>Voedingswaarden worden per productgewicht doorgerekend.</p>
	</div>
	<a class="button secondary" href={resolve('/api/excel')}>Excel downloaden</a>
</header>

{#if form?.ingredientError}<div class="alert error">{form.ingredientError}</div>{/if}
{#if form?.recipeError}<div class="alert error">{form.recipeError}</div>{/if}

{#if data.user?.role === 'admin'}
	<section class="form-card">
		<h2>Grondstof toevoegen</h2>
		<p>Neem de waarden per 100 gram over van de verpakking.</p>
		<form method="POST" action="?/createIngredient" class="nutrition-entry-grid">
			<div class="ingredient-name-field">
				<label for="ingredient-name">Naam</label><input
					id="ingredient-name"
					name="name"
					maxlength="100"
					required
				/>
			</div>
			<div>
				<label for="fat">Vet</label><input
					id="fat"
					name="fat"
					type="number"
					min="0"
					step="0.01"
					value="0"
					required
				/>
			</div>
			<div>
				<label for="saturates">Verzadigd</label><input
					id="saturates"
					name="saturates"
					type="number"
					min="0"
					step="0.01"
					value="0"
					required
				/>
			</div>
			<div>
				<label for="carbohydrates">Koolhydraten</label><input
					id="carbohydrates"
					name="carbohydrates"
					type="number"
					min="0"
					step="0.01"
					value="0"
					required
				/>
			</div>
			<div>
				<label for="sugars">Suikers</label><input
					id="sugars"
					name="sugars"
					type="number"
					min="0"
					step="0.01"
					value="0"
					required
				/>
			</div>
			<div>
				<label for="protein">Eiwit</label><input
					id="protein"
					name="protein"
					type="number"
					min="0"
					step="0.01"
					value="0"
					required
				/>
			</div>
			<div>
				<label for="salt">Zout</label><input
					id="salt"
					name="salt"
					type="number"
					min="0"
					step="0.001"
					value="0"
					required
				/>
			</div>
			<button class="button" type="submit">Opslaan</button>
		</form>
	</section>
{/if}

<section class="recipe-section">
	<div class="section-heading">
		<div>
			<h2>Grondstoffen</h2>
			<p>{data.ingredients.length} opgeslagen</p>
		</div>
	</div>
	{#each data.ingredients as ingredient (ingredient.id)}
		<details class="ingredient-card">
			<summary
				><span><strong>{ingredient.name}</strong><small>Per 100 g</small></span><span
					>{Math.round(ingredient.energyKcal * 4.184 * 10) / 10} kJ / {ingredient.energyKcal} kcal</span
				></summary
			>
			<div class="ingredient-details">
				<dl class="nutrition-compact">
					<div>
						<dt>Vet</dt>
						<dd>{ingredient.fat} g</dd>
					</div>
					<div>
						<dt>Verzadigd</dt>
						<dd>{ingredient.saturates} g</dd>
					</div>
					<div>
						<dt>Koolhydraten</dt>
						<dd>{ingredient.carbohydrates} g</dd>
					</div>
					<div>
						<dt>Suikers</dt>
						<dd>{ingredient.sugars} g</dd>
					</div>
					<div>
						<dt>Eiwit</dt>
						<dd>{ingredient.protein} g</dd>
					</div>
					<div>
						<dt>Zout</dt>
						<dd>{ingredient.salt} g</dd>
					</div>
				</dl>
				{#if data.user?.role === 'admin'}
					<form
						method="POST"
						action="?/updateIngredient"
						class="nutrition-entry-grid compact-fields"
					>
						<input type="hidden" name="id" value={ingredient.id} />
						<div class="ingredient-name-field">
							<label for={`name-${ingredient.id}`}>Naam</label><input
								id={`name-${ingredient.id}`}
								name="name"
								value={ingredient.name}
								required
							/>
						</div>
						<div>
							<label for={`fat-${ingredient.id}`}>Vet</label><input
								id={`fat-${ingredient.id}`}
								name="fat"
								type="number"
								min="0"
								step="0.01"
								value={ingredient.fat}
								required
							/>
						</div>
						<div>
							<label for={`sat-${ingredient.id}`}>Verzadigd</label><input
								id={`sat-${ingredient.id}`}
								name="saturates"
								type="number"
								min="0"
								step="0.01"
								value={ingredient.saturates}
								required
							/>
						</div>
						<div>
							<label for={`carb-${ingredient.id}`}>Koolhydraten</label><input
								id={`carb-${ingredient.id}`}
								name="carbohydrates"
								type="number"
								min="0"
								step="0.01"
								value={ingredient.carbohydrates}
								required
							/>
						</div>
						<div>
							<label for={`sugar-${ingredient.id}`}>Suikers</label><input
								id={`sugar-${ingredient.id}`}
								name="sugars"
								type="number"
								min="0"
								step="0.01"
								value={ingredient.sugars}
								required
							/>
						</div>
						<div>
							<label for={`protein-${ingredient.id}`}>Eiwit</label><input
								id={`protein-${ingredient.id}`}
								name="protein"
								type="number"
								min="0"
								step="0.01"
								value={ingredient.protein}
								required
							/>
						</div>
						<div>
							<label for={`salt-${ingredient.id}`}>Zout</label><input
								id={`salt-${ingredient.id}`}
								name="salt"
								type="number"
								min="0"
								step="0.001"
								value={ingredient.salt}
								required
							/>
						</div>
						<button class="button small" type="submit">Bijwerken</button>
					</form>
				{/if}
			</div>
		</details>
	{/each}
	{#if data.ingredients.length === 0}<div class="empty-state compact">
			<p>Voeg eerst een grondstof toe.</p>
		</div>{/if}
</section>

{#if data.user?.role === 'admin'}
	<section class="form-card recipe-builder">
		<h2>Receptregel toevoegen of aanpassen</h2>
		{#if data.ingredients.length}
			<form method="POST" action="?/upsertRecipeItem" class="recipe-line-form">
				<div>
					<label for="variant">Product en gewicht</label><select
						id="variant"
						name="productVariantId"
						required
						>{#each data.variants as variant (variant.id)}<option value={variant.id}
								>{variant.product.name} — {weight(variant.weightGrams)}</option
							>{/each}</select
					>
				</div>
				<div>
					<label for="ingredient">Grondstof</label><select
						id="ingredient"
						name="ingredientId"
						required
						>{#each data.ingredients as ingredient (ingredient.id)}<option value={ingredient.id}
								>{ingredient.name}</option
							>{/each}</select
					>
				</div>
				<div>
					<label for="amount">Hoeveelheid (g)</label><input
						id="amount"
						name="amountGrams"
						type="number"
						min="0.01"
						step="0.01"
						required
					/>
				</div>
				<button class="button" type="submit">Toevoegen</button>
			</form>
		{:else}<p>Voeg eerst minimaal één grondstof toe.</p>{/if}
	</section>
{/if}

<section class="recipe-section">
	<div class="section-heading">
		<div>
			<h2>Productrecepten en voedingswaarden</h2>
			<p>{data.recipes.length} recepten</p>
		</div>
	</div>
	<div class="recipe-list">
		{#each data.recipes as recipe (recipe.id)}
			<article class="recipe-card">
				<header class="recipe-card-header">
					<div>
						<h3>{recipe.productVariant.product.name}</h3>
						<span class="weight-badge">{weight(recipe.productVariant.weightGrams)}</span>
					</div>
					{#if recipe.nutrition}<button
							class="button small"
							type="button"
							onclick={() => copyText(recipe.nutrition!.label)}>Voedingswaarde kopiëren</button
						>{/if}
				</header>
				<div class="recipe-card-body">
					<div>
						<h4>Recept</h4>
						<ul class="recipe-ingredients">
							{#each recipe.ingredients as item (item.id)}<li>
									<span><strong>{item.ingredient.name}</strong> — {item.amountGrams} g</span
									>{#if data.user?.role === 'admin'}<form method="POST" action="?/deleteRecipeItem">
											<input type="hidden" name="id" value={item.id} /><button
												class="danger-link"
												type="submit">Verwijderen</button
											>
										</form>{/if}
								</li>{/each}
						</ul>
						{#if recipe.nutrition}<p
								class:balanced={recipe.nutrition.weightDifference === 0}
								class="weight-check"
							>
								Receptgewicht: {recipe.nutrition.ingredientWeight} g · eindgewicht: {recipe
									.productVariant.weightGrams} g
							</p>{/if}
					</div>
					{#if recipe.nutrition}<div>
							<h4>Per 100 g</h4>
							<dl class="nutrition-compact">
								<div>
									<dt>Energie</dt>
									<dd>{recipe.nutrition.energyKj} kJ / {recipe.nutrition.energyKcal} kcal</dd>
								</div>
								<div>
									<dt>Vet</dt>
									<dd>{recipe.nutrition.fat} g</dd>
								</div>
								<div>
									<dt>Verzadigd</dt>
									<dd>{recipe.nutrition.saturates} g</dd>
								</div>
								<div>
									<dt>Koolhydraten</dt>
									<dd>{recipe.nutrition.carbohydrates} g</dd>
								</div>
								<div>
									<dt>Suikers</dt>
									<dd>{recipe.nutrition.sugars} g</dd>
								</div>
								<div>
									<dt>Eiwit</dt>
									<dd>{recipe.nutrition.protein} g</dd>
								</div>
								<div>
									<dt>Zout</dt>
									<dd>{recipe.nutrition.salt} g</dd>
								</div>
							</dl>
						</div>
						<textarea class="label-output" readonly value={recipe.nutrition.label}></textarea>{/if}
				</div>
			</article>
		{/each}
	</div>
	{#if data.recipes.length === 0}<div class="empty-state compact">
			<p>Nog geen recepten ingevoerd.</p>
		</div>{/if}
	{#if copyStatus}<div class="alert success copy-status">{copyStatus}</div>{/if}
</section>
