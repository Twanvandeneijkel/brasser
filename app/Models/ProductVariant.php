<?php

namespace App\Models;

class ProductVariant extends AbstractModel
{
    public int $product_id;
    public int $weight_grams;
}
