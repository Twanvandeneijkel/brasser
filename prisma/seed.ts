import 'dotenv/config';
import argon2 from 'argon2';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../src/generated/prisma/client.ts';
import path from 'node:path';
import { existsSync } from 'node:fs';
import Database from 'better-sqlite3';

const defaultUrl = `file:${path.resolve('data/brassers.db').replaceAll('\\', '/')}`;
const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? defaultUrl });
const prisma = new PrismaClient({ adapter });

type LegacyStock = {
	product_name: string;
	weight_grams: number;
	current_stock: number;
	shelf_capacity: number;
	units_per_batch: number;
	updated_at: string;
};

function legacyDate(value: string): Date {
	return new Date(`${value.replace(' ', 'T')}Z`);
}

async function importLegacyData(): Promise<void> {
	const legacyPath = path.resolve('database/database.sqlite');
	if (!existsSync(legacyPath)) return;
	const legacy = new Database(legacyPath, { readonly: true });
	try {
		if ((await prisma.stockMovement.count()) === 0) {
			const stock = legacy
				.prepare(
					`SELECT p.name AS product_name, pv.weight_grams, si.current_stock,
						si.shelf_capacity, si.units_per_batch, si.updated_at
					 FROM stock_items si
					 JOIN product_variants pv ON pv.id = si.product_variant_id
					 JOIN products p ON p.id = pv.product_id`
				)
				.all() as LegacyStock[];
			for (const item of stock) {
				const variant = await prisma.productVariant.findFirst({
					where: { product: { name: item.product_name }, weightGrams: item.weight_grams },
					include: { stockItem: true }
				});
				if (!variant?.stockItem) continue;
				await prisma.stockItem.update({
					where: { id: variant.stockItem.id },
					data: {
						currentStock: item.current_stock,
						shelfCapacity: item.shelf_capacity,
						unitsPerBatch: item.units_per_batch,
						updatedAt: legacyDate(item.updated_at)
					}
				});
			}

			type LegacyMovement = LegacyStock & {
				previous_stock: number;
				new_stock: number;
				change_amount: number;
				note: string;
				recorded_by_name: string;
				username: string | null;
				created_at: string;
			};
			const movements = legacy
				.prepare(
					`SELECT p.name AS product_name, pv.weight_grams, sm.previous_stock,
						sm.new_stock, sm.change_amount, sm.note, sm.recorded_by_name,
						u.username, sm.created_at
					 FROM stock_movements sm
					 JOIN stock_items si ON si.id = sm.stock_item_id
					 JOIN product_variants pv ON pv.id = si.product_variant_id
					 JOIN products p ON p.id = pv.product_id
					 LEFT JOIN users u ON u.id = sm.recorded_by_user_id
					 ORDER BY sm.id`
				)
				.all() as LegacyMovement[];
			for (const movement of movements) {
				const variant = await prisma.productVariant.findFirst({
					where: { product: { name: movement.product_name }, weightGrams: movement.weight_grams },
					include: { stockItem: true }
				});
				const user = movement.username
					? await prisma.user.findUnique({ where: { username: movement.username } })
					: null;
				if (!variant?.stockItem) continue;
				await prisma.stockMovement.create({
					data: {
						stockItemId: variant.stockItem.id,
						previousStock: movement.previous_stock,
						newStock: movement.new_stock,
						changeAmount: movement.change_amount,
						note: movement.note,
						recordedByUserId: user?.id,
						recordedByName: movement.recorded_by_name,
						createdAt: legacyDate(movement.created_at)
					}
				});
			}
		}

		if ((await prisma.ingredient.count()) === 0) {
			type LegacyIngredient = {
				id: number;
				name: string;
				fat: number;
				saturates: number;
				carbohydrates: number;
				sugars: number;
				protein: number;
				salt: number;
				updated_at: string;
			};
			const ingredients = legacy
				.prepare('SELECT * FROM ingredients ORDER BY id')
				.all() as LegacyIngredient[];
			for (const ingredient of ingredients) {
				await prisma.ingredient.create({
					data: {
						name: ingredient.name,
						fat: ingredient.fat,
						saturates: ingredient.saturates,
						carbohydrates: ingredient.carbohydrates,
						sugars: ingredient.sugars,
						protein: ingredient.protein,
						salt: ingredient.salt,
						updatedAt: legacyDate(ingredient.updated_at)
					}
				});
			}

			type LegacyRecipeItem = {
				product_name: string;
				weight_grams: number;
				ingredient_name: string;
				amount_grams: number;
			};
			const recipeItems = legacy
				.prepare(
					`SELECT p.name AS product_name, pv.weight_grams,
						i.name AS ingredient_name, ri.amount_grams
					 FROM recipe_ingredients ri
					 JOIN recipes r ON r.id = ri.recipe_id
					 JOIN product_variants pv ON pv.id = r.product_variant_id
					 JOIN products p ON p.id = pv.product_id
					 JOIN ingredients i ON i.id = ri.ingredient_id`
				)
				.all() as LegacyRecipeItem[];
			for (const item of recipeItems) {
				const [variant, ingredient] = await Promise.all([
					prisma.productVariant.findFirst({
						where: { product: { name: item.product_name }, weightGrams: item.weight_grams }
					}),
					prisma.ingredient.findUnique({ where: { name: item.ingredient_name } })
				]);
				if (!variant || !ingredient) continue;
				const recipe = await prisma.recipe.upsert({
					where: { productVariantId: variant.id },
					update: {},
					create: { productVariantId: variant.id }
				});
				await prisma.recipeIngredient.upsert({
					where: { recipeId_ingredientId: { recipeId: recipe.id, ingredientId: ingredient.id } },
					update: { amountGrams: item.amount_grams },
					create: {
						recipeId: recipe.id,
						ingredientId: ingredient.id,
						amountGrams: item.amount_grams
					}
				});
			}
		}
	} finally {
		legacy.close();
	}
}

async function main() {
	const brasserPassword = await argon2.hash('fitkoren', { type: argon2.argon2id });

	await prisma.user.upsert({
		where: { username: 'brasser' },
		update: { name: 'Brasser', role: 'user' },
		create: {
			username: 'brasser',
			passwordHash: brasserPassword,
			name: 'Brasser',
			role: 'user'
		}
	});
	await prisma.user.upsert({
		where: { username: 'twan' },
		update: { name: 'Twan', role: 'admin' },
		create: {
			username: 'twan',
			passwordHash: '$2y$12$mq9L6RsEZSYJaY8yOFT9NeimRPatOIkSf8OUkfqkqPOCU5.AMA6H.',
			name: 'Twan',
			role: 'admin'
		}
	});

	const products = [
		{ name: 'Volkoren tarwemeel', weights: [1000, 2500, 5000] },
		{ name: 'Speltpittenbrood', weights: [500, 1000, 2500] }
	];
	for (const entry of products) {
		const product = await prisma.product.upsert({
			where: { name: entry.name },
			update: {},
			create: { name: entry.name }
		});
		for (const weightGrams of entry.weights) {
			const variant = await prisma.productVariant.upsert({
				where: { productId_weightGrams: { productId: product.id, weightGrams } },
				update: {},
				create: { productId: product.id, weightGrams }
			});
			await prisma.stockItem.upsert({
				where: { productVariantId: variant.id },
				update: {},
				create: { productVariantId: variant.id }
			});
		}
	}
	await importLegacyData();
}

main()
	.finally(async () => prisma.$disconnect())
	.catch((error: unknown) => {
		console.error(error);
		process.exitCode = 1;
	});
