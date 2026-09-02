<?php

namespace App\Repositories;

use App\Models\StockItem;

interface StockRepositoryInterface
{
    /** @return StockItem[] */
    public function allWithProducts(): array;

    public function findById(int $id): ?StockItem;

    public function updateStock(StockItem $stockItem): void;
}
