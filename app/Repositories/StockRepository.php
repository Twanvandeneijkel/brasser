<?php

namespace App\Repositories;

use App\Models\StockItem;
use PDO;

/** @extends AbstractRepository<StockItem> */
class StockRepository extends AbstractRepository implements StockRepositoryInterface
{
    protected string $tableName = 'stock_items';
    protected string $className = StockItem::class;

    /** @return StockItem[] */
    public function allWithProducts(): array
    {
        $rows = $this->database->run(
            'SELECT stock_items.*, products.name AS product_name, product_variants.weight_grams
             FROM stock_items
             INNER JOIN product_variants ON product_variants.id = stock_items.product_variant_id
             INNER JOIN products ON products.id = product_variants.product_id
             ORDER BY products.name, product_variants.weight_grams'
        )->fetchAll(PDO::FETCH_ASSOC);

        return array_map(fn (array $row): StockItem => $this->stockItemFromRow($row), $rows);
    }

    public function findById(int $id): ?StockItem
    {
        $row = $this->database->run(
            'SELECT stock_items.*, products.name AS product_name, product_variants.weight_grams
             FROM stock_items
             INNER JOIN product_variants ON product_variants.id = stock_items.product_variant_id
             INNER JOIN products ON products.id = product_variants.product_id
             WHERE stock_items.id = :id',
            ['id' => $id]
        )->fetch(PDO::FETCH_ASSOC);

        return is_array($row) ? $this->stockItemFromRow($row) : null;
    }

    public function updateStock(StockItem $stockItem): void
    {
        $this->database->run(
            'UPDATE stock_items
             SET current_stock = :current_stock,
                 shelf_capacity = :shelf_capacity,
                 units_per_batch = :units_per_batch,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = :id',
            [
                'current_stock' => $stockItem->current_stock,
                'shelf_capacity' => $stockItem->shelf_capacity,
                'units_per_batch' => $stockItem->units_per_batch,
                'id' => $stockItem->id,
            ]
        );
    }

    /** @param array<string, mixed> $row */
    private function stockItemFromRow(array $row): StockItem
    {
        $stockItem = new StockItem();
        $stockItem->id = (int) $row['id'];
        $stockItem->product_variant_id = (int) $row['product_variant_id'];
        $stockItem->product_name = (string) $row['product_name'];
        $stockItem->weight_grams = (int) $row['weight_grams'];
        $stockItem->current_stock = (int) $row['current_stock'];
        $stockItem->shelf_capacity = (int) $row['shelf_capacity'];
        $stockItem->units_per_batch = (int) $row['units_per_batch'];
        $stockItem->updated_at = (string) $row['updated_at'];
        return $stockItem;
    }
}
