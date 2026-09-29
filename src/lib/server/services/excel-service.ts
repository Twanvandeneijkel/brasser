import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { access, copyFile, mkdir, unlink } from 'node:fs/promises';
import ExcelJS, { type CellValue, type Worksheet } from 'exceljs';
import { prisma } from '$lib/server/prisma';
import { recipeService } from './recipe-service';
import { stockService, stockStatus, type StockStatus } from './stock-service';

const projectRoot = process.cwd();
const outputPath = path.join(projectRoot, 'Excel', 'Brassers_beheer.xlsx');
const templatePath = path.join(projectRoot, 'Excel', 'Voedingswaardes.xlsx');
const headerFill = 'FF0F766E';
const titleFill = 'FF0F4C5C';
const lightFill = 'FFF0FDFA';
const inputFill = 'FFE0F2FE';

let synchronizationQueue: Promise<void> = Promise.resolve();

const stockStatusLabels: Record<StockStatus, string> = {
	empty: 'Leeg',
	low: 'Laag',
	production: 'Aanvullen',
	full: 'Op niveau'
};

async function exists(filePath: string): Promise<boolean> {
	return access(filePath).then(
		() => true,
		() => false
	);
}

function safeText(value: string): string {
	return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

function columnName(index: number): string {
	let value = index;
	let name = '';
	while (value > 0) {
		value -= 1;
		name = String.fromCharCode(65 + (value % 26)) + name;
		value = Math.floor(value / 26);
	}
	return name;
}

function replaceSheet(workbook: ExcelJS.Workbook, name: string): Worksheet {
	const existing = workbook.getWorksheet(name);
	if (existing) workbook.removeWorksheet(existing.id);
	return workbook.addWorksheet(name, { views: [{ state: 'frozen', ySplit: 4 }] });
}

function styleTitle(sheet: Worksheet, lastColumn: string): void {
	sheet.mergeCells(`A1:${lastColumn}1`);
	const cell = sheet.getCell('A1');
	cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: titleFill } };
	cell.font = { name: 'Aptos', bold: true, color: { argb: 'FFFFFFFF' }, size: 15 };
	cell.alignment = { vertical: 'middle' };
	sheet.getRow(1).height = 28;
}

function styleHeader(row: ExcelJS.Row): void {
	row.height = 32;
	row.eachCell((cell) => {
		cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerFill } };
		cell.font = { name: 'Aptos', bold: true, color: { argb: 'FFFFFFFF' } };
		cell.alignment = { vertical: 'middle', wrapText: true };
	});
}

function writeGeneratedSheet(
	workbook: ExcelJS.Workbook,
	name: string,
	title: string,
	note: string,
	headers: string[],
	rows: CellValue[][],
	widths: number[]
): Worksheet {
	const sheet = replaceSheet(workbook, name);
	const lastColumn = columnName(headers.length);
	sheet.getCell('A1').value = title;
	styleTitle(sheet, lastColumn);
	sheet.mergeCells(`A2:${lastColumn}2`);
	sheet.getCell('A2').value = note;
	sheet.getCell('A2').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: lightFill } };
	sheet.getCell('A2').alignment = { vertical: 'middle', wrapText: true };
	sheet.getRow(2).height = 34;
	sheet.getRow(4).values = headers;
	styleHeader(sheet.getRow(4));
	for (const values of rows) sheet.addRow(values);
	const lastRow = Math.max(4, sheet.rowCount);
	sheet.autoFilter = `A4:${lastColumn}${lastRow}`;
	sheet.views = [{ state: 'frozen', ySplit: 4, showGridLines: false }];
	widths.forEach((width, index) => {
		sheet.getColumn(index + 1).width = width;
	});
	for (let row = 5; row <= lastRow; row += 1) {
		sheet.getRow(row).eachCell((cell) => {
			cell.font = { name: 'Aptos', size: 10 };
			cell.alignment = { vertical: 'middle' };
			cell.border = { bottom: { style: 'hair', color: { argb: 'FFE5E7EB' } } };
		});
	}
	return sheet;
}

async function loadWorkbook(): Promise<ExcelJS.Workbook> {
	const workbook = new ExcelJS.Workbook();
	if (await exists(outputPath)) await workbook.xlsx.readFile(outputPath);
	else if (await exists(templatePath)) await workbook.xlsx.readFile(templatePath);
	return workbook;
}

function syncInfo(workbook: ExcelJS.Workbook): void {
	const info = replaceSheet(workbook, 'Uitleg');
	info.views = [{ state: 'frozen', ySplit: 3, showGridLines: false }];
	info.getCell('A1').value = 'Brassers — zelfstandig Excel-overzicht';
	styleTitle(info, 'D');
	info.getRow(3).values = ['Onderdeel', 'Uitleg', 'Bron', 'Laatst bijgewerkt'];
	styleHeader(info.getRow(3));
	info.addRows([
		[
			'Websitegegevens',
			'Producten, voorraad, grondstoffen en recepten worden automatisch vernieuwd.',
			'SvelteKit + Prisma',
			new Date()
		],
		[
			'Zelfstandig gebruik',
			'De tabbladen en formules blijven werken wanneer de website niet actief is.',
			'Excel',
			'Direct beschikbaar'
		],
		[
			'Excel naar website',
			'Wijzigingen die alleen in Excel worden gemaakt gaan niet automatisch terug.',
			'Alleen-lezen synchronisatie',
			'Voorkomt conflicten'
		],
		[
			'Handmatige calculator',
			'Gebruik Recepten en Database voor losse berekeningen.',
			'Excel-formules',
			'Maximaal 100 regels'
		]
	]);
	[24, 76, 26, 24].forEach((width, index) => (info.getColumn(index + 1).width = width));
}

async function syncDatabase(workbook: ExcelJS.Workbook): Promise<void> {
	const ingredients = await prisma.ingredient.findMany({ orderBy: { name: 'asc' } });
	const sheet = workbook.getWorksheet('Database') ?? workbook.addWorksheet('Database');
	sheet.getRow(1).values = [
		'Ingrediënt',
		'Energie (kcal)',
		'Vet (g)',
		'Verzadigd vet (g)',
		'Koolhydraten (g)',
		'Suikers (g)',
		'Vezels (g)',
		'Eiwitten (g)',
		'Zout (g)',
		'Website-ID',
		'Website bijgewerkt'
	];
	styleHeader(sheet.getRow(1));
	const byId = new Map<number, number>();
	const byName = new Map<string, number>();
	for (let row = 2; row <= Math.max(2, sheet.rowCount); row += 1) {
		const id = Number(sheet.getCell(`J${row}`).value);
		const name = String(sheet.getCell(`A${row}`).value ?? '').trim();
		if (Number.isSafeInteger(id) && id > 0) byId.set(id, row);
		if (name) byName.set(name.toLocaleLowerCase('nl-NL'), row);
	}
	for (const ingredient of ingredients) {
		const row =
			byId.get(ingredient.id) ??
			byName.get(ingredient.name.toLocaleLowerCase('nl-NL')) ??
			sheet.rowCount + 1;
		sheet.getCell(`A${row}`).value = safeText(ingredient.name);
		sheet.getCell(`B${row}`).value = {
			formula: `C${row}*9+E${row}*4+H${row}*4`,
			result: ingredient.fat * 9 + ingredient.carbohydrates * 4 + ingredient.protein * 4
		};
		const values: CellValue[] = [
			ingredient.fat,
			ingredient.saturates,
			ingredient.carbohydrates,
			ingredient.sugars,
			0,
			ingredient.protein,
			ingredient.salt,
			ingredient.id,
			ingredient.updatedAt.toISOString()
		];
		values.forEach((value, index) => (sheet.getCell(row, index + 3).value = value));
	}
	[28, 16, 14, 18, 18, 14, 14, 14, 12, 12, 24].forEach(
		(width, index) => (sheet.getColumn(index + 1).width = width)
	);
	sheet.views = [{ state: 'frozen', ySplit: 1, showGridLines: false }];
}

async function performSynchronization(): Promise<string> {
	const workbook = await loadWorkbook();
	workbook.creator = 'Brassers SvelteKit';
	workbook.lastModifiedBy = 'Brassers SvelteKit';
	workbook.title = 'Brassers voorraad, recepten en voedingswaarden';
	workbook.calcProperties.fullCalcOnLoad = true;
	syncInfo(workbook);
	await syncDatabase(workbook);

	const [variants, stock, movements, recipeData] = await Promise.all([
		prisma.productVariant.findMany({
			include: { product: true },
			orderBy: [{ product: { name: 'asc' } }, { weightGrams: 'asc' }]
		}),
		stockService.list('', 'all'),
		stockService.recentMovements(100),
		recipeService.pageData()
	]);

	writeGeneratedSheet(
		workbook,
		'Producten',
		'Producten en gewichtsvarianten',
		'Automatisch uit Prisma. Gewichten staan in gram.',
		['Product-ID', 'Variant-ID', 'Productnaam', 'Gewicht (g)'],
		variants.map((variant) => [
			variant.productId,
			variant.id,
			safeText(variant.product.name),
			variant.weightGrams
		]),
		[13, 13, 34, 16]
	);

	const stockRows = stock.map((item, index): CellValue[] => {
		const row = index + 5;
		return [
			item.id,
			item.productVariantId,
			safeText(item.productName),
			item.weightGrams,
			item.currentStock,
			item.shelfCapacity,
			item.unitsPerBatch,
			{ formula: `MAX(0,F${row}-E${row})`, result: item.advice.neededUnits },
			{ formula: `IF(H${row}=0,0,ROUNDUP(H${row}/G${row},0))`, result: item.advice.batches },
			{ formula: `I${row}*G${row}`, result: item.advice.productionUnits },
			{ formula: `MAX(0,J${row}-H${row})`, result: item.advice.overflow },
			{
				formula: `IF(E${row}=0,"Leeg",IF(E${row}/F${row}<=0.25,"Laag",IF(E${row}<F${row},"Aanvullen","Op niveau")))`,
				result: stockStatusLabels[stockStatus(item.currentStock, item.shelfCapacity)]
			},
			item.updatedAt.toISOString()
		];
	});
	const stockSheet = writeGeneratedSheet(
		workbook,
		'Voorraad',
		'Actuele winkelvoorraad en productieadvies',
		'Blauwe cellen zijn lokaal aanpasbaar; de advieskolommen rekenen opnieuw.',
		[
			'Voorraad-ID',
			'Variant-ID',
			'Product',
			'Gewicht (g)',
			'Actueel',
			'Vakcapaciteit',
			'Per ronde',
			'Nog nodig',
			'Rondes',
			'Te maken',
			'Extra',
			'Status',
			'Bijgewerkt'
		],
		stockRows,
		[13, 12, 30, 14, 12, 16, 13, 13, 11, 12, 10, 15, 24]
	);
	for (let row = 5; row <= stockSheet.rowCount; row += 1) {
		for (let column = 5; column <= 7; column += 1) {
			stockSheet.getCell(row, column).fill = {
				type: 'pattern',
				pattern: 'solid',
				fgColor: { argb: inputFill }
			};
		}
	}

	writeGeneratedSheet(
		workbook,
		'Voorraadhistorie',
		'Laatste voorraadtellingen',
		'De meest recente 100 tellingen uit de website.',
		[
			'Mutatie-ID',
			'Voorraad-ID',
			'Product',
			'Gewicht (g)',
			'Vorige',
			'Nieuw',
			'Verschil',
			'Door',
			'Notitie',
			'Moment'
		],
		movements.map((movement) => [
			movement.id,
			movement.stockItemId,
			safeText(movement.stockItem.productVariant.product.name),
			movement.stockItem.productVariant.weightGrams,
			movement.previousStock,
			movement.newStock,
			movement.changeAmount,
			safeText(movement.recordedByName),
			safeText(movement.note),
			movement.createdAt.toISOString()
		]),
		[13, 13, 30, 14, 11, 11, 11, 18, 38, 24]
	);

	const recipeRows: CellValue[][] = [];
	for (const recipe of recipeData.recipes) {
		for (const item of recipe.ingredients) {
			recipeRows.push([
				recipe.id,
				recipe.productVariantId,
				safeText(recipe.productVariant.product.name),
				recipe.productVariant.weightGrams,
				item.id,
				item.ingredientId,
				safeText(item.ingredient.name),
				item.amountGrams,
				recipe.updatedAt.toISOString()
			]);
		}
	}
	writeGeneratedSheet(
		workbook,
		'Receptregels website',
		'Recepten uit de website',
		'Iedere rij is één grondstof in één productvariant.',
		[
			'Recept-ID',
			'Variant-ID',
			'Product',
			'Eindgewicht (g)',
			'Regel-ID',
			'Grondstof-ID',
			'Grondstof',
			'Hoeveelheid (g)',
			'Bijgewerkt'
		],
		recipeRows,
		[12, 12, 30, 18, 12, 14, 28, 18, 24]
	);

	writeGeneratedSheet(
		workbook,
		'Voedingswaarden website',
		'Voedingswaarden per product',
		'Per 100 gram berekend uit de recepten. De laatste kolom bevat kopieerbare tekst.',
		[
			'Recept-ID',
			'Variant-ID',
			'Product',
			'Gewicht (g)',
			'Energie (kJ)',
			'Energie (kcal)',
			'Vet (g)',
			'Verzadigd (g)',
			'Koolhydraten (g)',
			'Suikers (g)',
			'Eiwit (g)',
			'Zout (g)',
			'Kopieerbare tekst'
		],
		recipeData.recipes
			.filter((recipe) => recipe.nutrition)
			.map((recipe) => [
				recipe.id,
				recipe.productVariantId,
				safeText(recipe.productVariant.product.name),
				recipe.productVariant.weightGrams,
				recipe.nutrition!.energyKj,
				recipe.nutrition!.energyKcal,
				recipe.nutrition!.fat,
				recipe.nutrition!.saturates,
				recipe.nutrition!.carbohydrates,
				recipe.nutrition!.sugars,
				recipe.nutrition!.protein,
				recipe.nutrition!.salt,
				safeText(recipe.nutrition!.label)
			]),
		[12, 12, 30, 14, 15, 17, 12, 15, 19, 13, 12, 12, 62]
	);

	await mkdir(path.dirname(outputPath), { recursive: true });
	const temporaryPath = `${outputPath}.tmp-${randomUUID()}`;
	await workbook.xlsx.writeFile(temporaryPath);
	try {
		await copyFile(temporaryPath, outputPath);
	} finally {
		await unlink(temporaryPath).catch(() => undefined);
	}
	return outputPath;
}

export function synchronizeExcel(): Promise<string> {
	let result = '';
	const operation = synchronizationQueue.then(async () => {
		result = await performSynchronization();
	});
	synchronizationQueue = operation.catch(() => undefined);
	return operation.then(() => result);
}

export function getExcelPath(): string {
	return outputPath;
}
