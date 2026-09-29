<script lang="ts">
	import { resolve } from '$app/paths';
	let { data, form } = $props();
	const statusLabels: Record<string, string> = {
		empty: 'Leeg',
		low: 'Laag',
		production: 'Aanvullen',
		full: 'Op niveau'
	};
	const weight = (grams: number) =>
		grams < 1000
			? `${grams} g`
			: `${new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 2 }).format(grams / 1000)} kg`;
	const dateTime = (value: Date | string) =>
		new Intl.DateTimeFormat('nl-NL', { dateStyle: 'short', timeStyle: 'short' }).format(
			new Date(value)
		);
</script>

<svelte:head><title>Voorraad | Brassers</title></svelte:head>

<header class="page-heading inventory-heading">
	<div>
		<p class="eyebrow">Actuele winkelvoorraad</p>
		<h1>Voorraad bijhouden</h1>
		<p>Tel wat er werkelijk in het vak ligt. Het productieadvies wordt direct opnieuw berekend.</p>
	</div>
	<div class="actions compact-actions">
		<a class="button secondary" href={resolve('/api/excel')}>Excel downloaden</a
		>{#if data.user?.role === 'admin'}<a class="button secondary" href="#nieuw-product"
				>Nieuw product</a
			>{/if}
	</div>
</header>

{#if form?.actionError}<div class="alert error" role="alert">{form.actionError}</div>{/if}

<section class="inventory-summary" aria-label="Voorraadsamenvatting">
	<article><span>Varianten</span><strong>{data.summary.totalItems}</strong></article>
	<article><span>Eenheden in winkel</span><strong>{data.summary.totalUnits}</strong></article>
	<article class="summary-warning">
		<span>Productie nodig</span><strong>{data.summary.productionItems}</strong>
	</article>
	<article class="summary-danger">
		<span>Lege vakken</span><strong>{data.summary.emptyItems}</strong>
	</article>
</section>

{#if data.user?.role !== 'admin'}<div class="permission-notice">
		<strong>Alleen-lezen.</strong> Alleen een beheerder kan tellingen en instellingen wijzigen.
	</div>{/if}

{#if data.user?.role === 'admin'}
	<details id="nieuw-product" class="admin-panel" open={Boolean(form?.createError)}>
		<summary>Product of gewichtsvariant toevoegen</summary>
		<div class="admin-panel-content">
			{#if form?.createError}<div class="alert error">{form.createError}</div>{/if}
			<form method="POST" action="?/createProduct" class="product-form">
				<div>
					<label for="name">Productnaam</label><input
						id="name"
						name="name"
						maxlength="100"
						required
						placeholder="Volkoren tarwemeel"
					/>
				</div>
				<div>
					<label for="weights">Beschikbare gewichten</label><input
						id="weights"
						name="weights"
						maxlength="500"
						required
						placeholder="500g, 1kg, 2.5kg"
					/>
				</div>
				<button class="button" type="submit">Product toevoegen</button>
			</form>
		</div>
	</details>
{/if}

<section class="inventory-tools">
	<form class="inventory-filter" method="GET">
		<div>
			<label for="q">Zoek product of gewicht</label><input
				id="q"
				name="q"
				type="search"
				value={data.filters.query}
				maxlength="100"
			/>
		</div>
		<div>
			<label for="status">Voorraadstatus</label><select
				id="status"
				name="status"
				value={data.filters.status}
				><option value="all">Alle statussen</option><option value="empty">Leeg</option><option
					value="low">Laag</option
				><option value="production">Productie nodig</option><option value="full">Op niveau</option
				></select
			>
		</div>
		<button class="button" type="submit">Filter toepassen</button>
	</form>
	<p>{data.items.length} van {data.summary.totalItems} zichtbaar</p>
</section>

<section class="inventory-list" aria-label="Producten">
	{#each data.items as item (item.id)}
		<article class={`inventory-card status-${item.status}`}>
			<header class="inventory-card-header">
				<div>
					<div class="inventory-title-line">
						<h2>{item.productName}</h2>
						<span class="weight-badge">{weight(item.weightGrams)}</span>
					</div>
					<small>Laatst aangepast: {dateTime(item.updatedAt)}</small>
				</div>
				<span class={`status-badge status-badge-${item.status}`}>{statusLabels[item.status]}</span>
			</header>
			<div class="inventory-card-body">
				<section class="stock-level">
					<div class="stock-number">
						<strong>{item.currentStock}</strong><span>van {item.shelfCapacity}</span>
					</div>
					<progress max="100" value={item.fillPercentage}>{item.fillPercentage}%</progress><small
						>{item.fillPercentage}% gevuld</small
					>
				</section>
				<dl class="production-advice">
					<div>
						<dt>Nog nodig</dt>
						<dd>{item.advice.neededUnits}</dd>
					</div>
					<div>
						<dt>Rondes</dt>
						<dd>{item.advice.batches}</dd>
					</div>
					<div class="advice-highlight">
						<dt>Te maken</dt>
						<dd>{item.advice.productionUnits}</dd>
					</div>
					<div>
						<dt>Extra</dt>
						<dd>{item.advice.overflow}</dd>
					</div>
				</dl>
				<dl class="stock-standards">
					<div>
						<dt>Vakcapaciteit</dt>
						<dd>{item.shelfCapacity}</dd>
					</div>
					<div>
						<dt>Per ronde</dt>
						<dd>{item.unitsPerBatch}</dd>
					</div>
				</dl>
			</div>
			{#if data.user?.role === 'admin'}
				<div class="inventory-actions">
					<details open>
						<summary>Nieuwe telling</summary>
						<form method="POST" action="?/recordCount" class="count-form">
							<input type="hidden" name="id" value={item.id} />
							<div>
								<label for={`count-${item.id}`}>Geteld aantal</label><input
									id={`count-${item.id}`}
									name="countedStock"
									type="number"
									min="0"
									max={item.shelfCapacity}
									value={item.currentStock}
									required
								/>
							</div>
							<div>
								<label for={`note-${item.id}`}>Notitie</label><input
									id={`note-${item.id}`}
									name="note"
									maxlength="160"
								/>
							</div>
							<button class="button" type="submit">Opslaan</button>
						</form>
					</details>
					<details>
						<summary>Standaardwaarden</summary>
						<form method="POST" action="?/updateSettings" class="settings-form">
							<input type="hidden" name="id" value={item.id} />
							<div>
								<label for={`capacity-${item.id}`}>Vakcapaciteit</label><input
									id={`capacity-${item.id}`}
									name="shelfCapacity"
									type="number"
									min={Math.max(1, item.currentStock)}
									value={item.shelfCapacity}
									required
								/>
							</div>
							<div>
								<label for={`batch-${item.id}`}>Per ronde</label><input
									id={`batch-${item.id}`}
									name="unitsPerBatch"
									type="number"
									min="1"
									value={item.unitsPerBatch}
									required
								/>
							</div>
							<button class="button secondary" type="submit">Opslaan</button>
						</form>
					</details>
				</div>
			{/if}
		</article>
	{/each}
	{#if data.items.length === 0}<div class="empty-state">
			<p>Geen voorraadregels gevonden.</p>
		</div>{/if}
</section>

<section class="movement-section">
	<div class="section-heading">
		<div>
			<h2>Recente voorraadtellingen</h2>
			<p>De laatste {data.movements.length} opgeslagen tellingen.</p>
		</div>
	</div>
	{#if data.movements.length}
		<div class="table-wrap">
			<table>
				<thead
					><tr
						><th>Moment</th><th>Product</th><th>Voorraad</th><th>Verschil</th><th>Door</th><th
							>Notitie</th
						></tr
					></thead
				><tbody
					>{#each data.movements as movement (movement.id)}<tr
							><td>{dateTime(movement.createdAt)}</td><td
								><strong>{movement.stockItem.productVariant.product.name}</strong><br /><small
									>{weight(movement.stockItem.productVariant.weightGrams)}</small
								></td
							><td>{movement.previousStock} → {movement.newStock}</td><td
								>{movement.changeAmount > 0 ? '+' : ''}{movement.changeAmount}</td
							><td>{movement.recordedByName}</td><td>{movement.note || '—'}</td></tr
						>{/each}</tbody
				>
			</table>
		</div>
	{:else}<div class="empty-state compact"><p>Er zijn nog geen tellingen.</p></div>{/if}
</section>
