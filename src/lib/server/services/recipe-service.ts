import { prisma } from '$lib/server/prisma';
import { calculateNutrition, formatWeight, type NutritionResult } from './nutrition-service';

type RecipeWithRelations = Awaited<ReturnType<typeof getRecipes>>[number];
type IngredientInput = {
	name: string;
	fat: number;
	saturates: number;
	carbohydrates: number;
	sugars: number;
	protein: number;
	salt: number;
};

function getRecipes() {
	return prisma.recipe.findMany({
		include: {
			productVariant: { include: { product: true } },
			ingredients: { include: { ingredient: true }, orderBy: { amountGrams: 'desc' } }
		},
		orderBy: [
			{ productVariant: { product: { name: 'asc' } } },
			{ productVariant: { weightGrams: 'asc' } }
		]
	});
}

export function calculateRecipeNutrition(recipe: RecipeWithRelations):
	| (NutritionResult & {
			ingredientWeight: number;
			weightDifference: number;
	  })
	| null {
	if (recipe.ingredients.length === 0) return null;
	const totals = { fat: 0, saturates: 0, carbohydrates: 0, sugars: 0, protein: 0, salt: 0 };
	let ingredientWeight = 0;
	for (const item of recipe.ingredients) {
		const factor = item.amountGrams / 100;
		ingredientWeight += item.amountGrams;
		totals.fat += item.ingredient.fat * factor;
		totals.saturates += item.ingredient.saturates * factor;
		totals.carbohydrates += item.ingredient.carbohydrates * factor;
		totals.sugars += item.ingredient.sugars * factor;
		totals.protein += item.ingredient.protein * factor;
		totals.salt += item.ingredient.salt * factor;
	}
	const finishedWeightFactor = 100 / recipe.productVariant.weightGrams;
	const nutrition = calculateNutrition({
		productName: `${recipe.productVariant.product.name} ${formatWeight(recipe.productVariant.weightGrams)}`,
		portionGrams: recipe.productVariant.weightGrams,
		fat: Math.round(totals.fat * finishedWeightFactor * 100) / 100,
		saturates: Math.round(totals.saturates * finishedWeightFactor * 100) / 100,
		carbohydrates: Math.round(totals.carbohydrates * finishedWeightFactor * 100) / 100,
		sugars: Math.round(totals.sugars * finishedWeightFactor * 100) / 100,
		protein: Math.round(totals.protein * finishedWeightFactor * 100) / 100,
		salt: Math.round(totals.salt * finishedWeightFactor * 100) / 100
	});
	return {
		...nutrition,
		label: `INGREDIËNTEN: ${recipe.ingredients.map((item) => item.ingredient.name).join(', ')}\n\n${nutrition.label}`,
		ingredientWeight: Math.round(ingredientWeight * 10) / 10,
		weightDifference: Math.round((ingredientWeight - recipe.productVariant.weightGrams) * 10) / 10
	};
}

export const recipeService = {
	async pageData() {
		const [ingredients, variants, recipes] = await Promise.all([
			prisma.ingredient.findMany({ orderBy: { name: 'asc' } }),
			prisma.productVariant.findMany({
				include: { product: true },
				orderBy: [{ product: { name: 'asc' } }, { weightGrams: 'asc' }]
			}),
			getRecipes()
		]);
		return {
			ingredients: ingredients.map((ingredient) => ({
				...ingredient,
				energyKcal:
					Math.round(
						(ingredient.fat * 9 + ingredient.carbohydrates * 4 + ingredient.protein * 4) * 10
					) / 10
			})),
			variants,
			recipes: recipes.map((recipe) => ({ ...recipe, nutrition: calculateRecipeNutrition(recipe) }))
		};
	},

	async createIngredient(data: IngredientInput) {
		const names = await prisma.ingredient.findMany({ select: { name: true } });
		if (
			names.some(
				(entry) => entry.name.toLocaleLowerCase('nl-NL') === data.name.toLocaleLowerCase('nl-NL')
			)
		) {
			throw new Error('INGREDIENT_EXISTS');
		}
		return prisma.ingredient.create({ data });
	},

	async updateIngredient(id: number, data: IngredientInput) {
		const names = await prisma.ingredient.findMany({
			where: { id: { not: id } },
			select: { name: true }
		});
		if (
			names.some(
				(entry) => entry.name.toLocaleLowerCase('nl-NL') === data.name.toLocaleLowerCase('nl-NL')
			)
		) {
			throw new Error('INGREDIENT_EXISTS');
		}
		return prisma.ingredient.update({ where: { id }, data });
	},

	async upsertRecipeIngredient(
		productVariantId: number,
		ingredientId: number,
		amountGrams: number
	) {
		return prisma.$transaction(async (transaction) => {
			const [variant, ingredient] = await Promise.all([
				transaction.productVariant.findUnique({ where: { id: productVariantId } }),
				transaction.ingredient.findUnique({ where: { id: ingredientId } })
			]);
			if (!variant || !ingredient) throw new Error('REFERENCE_NOT_FOUND');
			const recipe = await transaction.recipe.upsert({
				where: { productVariantId },
				update: {},
				create: { productVariantId }
			});
			return transaction.recipeIngredient.upsert({
				where: { recipeId_ingredientId: { recipeId: recipe.id, ingredientId } },
				update: { amountGrams },
				create: { recipeId: recipe.id, ingredientId, amountGrams }
			});
		});
	},

	async deleteRecipeIngredient(id: number) {
		return prisma.recipeIngredient.delete({ where: { id } });
	},

	allRecipes: getRecipes
};
