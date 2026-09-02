<?php

namespace App\Repositories;

interface ProductRepositoryInterface
{
    public function nameExists(string $name): bool;

    /** @param int[] $weights */
    public function createWithWeights(string $name, array $weights): int;
}
