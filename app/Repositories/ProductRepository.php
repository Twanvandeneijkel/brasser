<?php

namespace App\Repositories;

use Framework\Database;
use Throwable;

class ProductRepository implements ProductRepositoryInterface
{
    public function __construct(private readonly Database $database)
    {
    }

    public function nameExists(string $name): bool
    {
        return (bool) $this->database->run(
            'SELECT 1 FROM products WHERE LOWER(name) = LOWER(:name)',
            ['name' => $name]
        )->fetchColumn();
    }

    /** @param int[] $weights */
    public function createWithWeights(string $name, array $weights): int
    {
        $this->database->exec('BEGIN TRANSACTION');
        try {
            $this->database->run('INSERT INTO products (name) VALUES (:name)', ['name' => $name]);
            $productId = $this->database->getLastID();

            foreach ($weights as $weight) {
                $this->database->run(
                    'INSERT INTO product_variants (product_id, weight_grams)
                     VALUES (:product_id, :weight_grams)',
                    ['product_id' => $productId, 'weight_grams' => $weight]
                );
                $variantId = $this->database->getLastID();
                $this->database->run(
                    'INSERT INTO stock_items (product_variant_id) VALUES (:product_variant_id)',
                    ['product_variant_id' => $variantId]
                );
            }

            $this->database->exec('COMMIT');
            return $productId;
        } catch (Throwable $exception) {
            $this->database->exec('ROLLBACK');
            throw $exception;
        }
    }
}
