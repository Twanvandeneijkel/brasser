import { prisma } from '$lib/server/prisma';

export type StockStatus = 'empty' | 'low' | 'production' | 'full';

export function calculateAdvice(
	currentStock: number,
	shelfCapacity: number,
	unitsPerBatch: number
) {
	const neededUnits = Math.max(0, shelfCapacity - currentStock);
	const batches = neededUnits === 0 ? 0 : Math.ceil(neededUnits / unitsPerBatch);
	const productionUnits = batches * unitsPerBatch;
	return {
		neededUnits,
		batches,
		productionUnits,
		overflow: Math.max(0, productionUnits - neededUnits)
	};
}

export function stockStatus(currentStock: number, shelfCapacity: number): StockStatus {
	if (currentStock === 0) return 'empty';
	if (currentStock / shelfCapacity <= 0.25) return 'low';
	if (currentStock < shelfCapacity) return 'production';
	return 'full';
}

export const stockService = {
	async list(query = '', status: StockStatus | 'all' = 'all') {
		const items = await prisma.stockItem.findMany({
			include: { productVariant: { include: { product: true } } },
			orderBy: [
				{ productVariant: { product: { name: 'asc' } } },
				{ productVariant: { weightGrams: 'asc' } }
			]
		});
		const normalizedQuery = query.trim().toLocaleLowerCase('nl-NL');
		return items
			.map((item) => {
				const itemStatus = stockStatus(item.currentStock, item.shelfCapacity);
				return {
					...item,
					productName: item.productVariant.product.name,
					weightGrams: item.productVariant.weightGrams,
					status: itemStatus,
					fillPercentage: Math.min(100, Math.round((item.currentStock / item.shelfCapacity) * 100)),
					advice: calculateAdvice(item.currentStock, item.shelfCapacity, item.unitsPerBatch)
				};
			})
			.filter((item) => {
				const text = `${item.productName} ${item.weightGrams}`.toLocaleLowerCase('nl-NL');
				const queryMatches = !normalizedQuery || text.includes(normalizedQuery);
				const statusMatches = status === 'all' || item.status === status;
				return queryMatches && statusMatches;
			});
	},

	async summary() {
		const items = await prisma.stockItem.findMany();
		return {
			totalItems: items.length,
			totalUnits: items.reduce((sum, item) => sum + item.currentStock, 0),
			emptyItems: items.filter((item) => item.currentStock === 0).length,
			productionItems: items.filter((item) => item.currentStock < item.shelfCapacity).length
		};
	},

	async recentMovements(limit = 30) {
		return prisma.stockMovement.findMany({
			take: Math.max(1, Math.min(100, limit)),
			include: { stockItem: { include: { productVariant: { include: { product: true } } } } },
			orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]
		});
	},

	async createProduct(name: string, weights: number[]) {
		const existingNames = await prisma.product.findMany({ select: { name: true } });
		if (
			existingNames.some(
				(entry) => entry.name.toLocaleLowerCase('nl-NL') === name.toLocaleLowerCase('nl-NL')
			)
		) {
			throw new Error('PRODUCT_EXISTS');
		}
		return prisma.product.create({
			data: {
				name,
				variants: {
					create: weights.map((weightGrams) => ({ weightGrams, stockItem: { create: {} } }))
				}
			}
		});
	},

	async recordCount(
		stockItemId: number,
		newStock: number,
		user: NonNullable<App.Locals['user']>,
		note: string
	) {
		return prisma.$transaction(async (transaction) => {
			const item = await transaction.stockItem.findUnique({ where: { id: stockItemId } });
			if (!item) throw new Error('STOCK_NOT_FOUND');
			if (newStock < 0 || newStock > item.shelfCapacity) throw new Error('INVALID_STOCK');
			await transaction.stockItem.update({
				where: { id: item.id },
				data: { currentStock: newStock }
			});
			await transaction.stockMovement.create({
				data: {
					stockItemId: item.id,
					previousStock: item.currentStock,
					newStock,
					changeAmount: newStock - item.currentStock,
					note,
					recordedByUserId: user.id,
					recordedByName: user.name ?? user.username
				}
			});
			return item.currentStock;
		});
	},

	async updateSettings(stockItemId: number, shelfCapacity: number, unitsPerBatch: number) {
		const item = await prisma.stockItem.findUnique({ where: { id: stockItemId } });
		if (!item) throw new Error('STOCK_NOT_FOUND');
		if (shelfCapacity < 1 || unitsPerBatch < 1 || shelfCapacity < item.currentStock) {
			throw new Error('INVALID_SETTINGS');
		}
		return prisma.stockItem.update({
			where: { id: item.id },
			data: { shelfCapacity, unitsPerBatch }
		});
	}
};
