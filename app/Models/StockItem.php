<?php

namespace App\Models;

class StockItem extends AbstractModel
{
    public int $product_variant_id;
    public string $product_name;
    public int $weight_grams;
    public int $current_stock;
    public int $shelf_capacity;
    public int $units_per_batch;
    public string $updated_at;
}
