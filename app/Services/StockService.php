<?php

namespace App\Services;

use App\Models\StockItem;

class StockService
{
    /**
     * @return array{needed_units: int, batches: int, production_units: int, overflow: int}
     */
    public function calculateAdvice(StockItem $item): array
    {
        $neededUnits = max(0, $item->shelf_capacity - $item->current_stock);
        $batches = $neededUnits === 0 ? 0 : (int) ceil($neededUnits / $item->units_per_batch);
        $productionUnits = $batches * $item->units_per_batch;

        return [
            'needed_units' => $neededUnits,
            'batches' => $batches,
            'production_units' => $productionUnits,
            'overflow' => max(0, $productionUnits - $neededUnits),
        ];
    }

    /** @return array<string, string> */
    public function validateStock(int $currentStock, int $capacity, int $unitsPerBatch): array
    {
        $errors = [];
        if ($currentStock < 0) {
            $errors['current_stock'] = 'De huidige voorraad kan niet negatief zijn.';
        }
        if ($capacity < 1) {
            $errors['shelf_capacity'] = 'De vakcapaciteit moet minimaal 1 zijn.';
        }
        if ($currentStock > $capacity) {
            $errors['current_stock'] = 'De huidige voorraad kan niet hoger zijn dan de vakcapaciteit.';
        }
        if ($unitsPerBatch < 1) {
            $errors['units_per_batch'] = 'Het aantal per productieronde moet minimaal 1 zijn.';
        }

        return $errors;
    }

    /** @return int[]|null */
    public function parseWeights(string $input): ?array
    {
        $parts = preg_split('/[,;\n]+/', strtolower(trim($input)));
        if ($parts === false || $parts === []) {
            return null;
        }

        $weights = [];
        foreach ($parts as $part) {
            $part = trim($part);
            if (!preg_match('/^(\d+(?:[.,]\d+)?)\s*(kg|g)?$/', $part, $matches)) {
                return null;
            }

            $number = (float) str_replace(',', '.', $matches[1]);
            $grams = ($matches[2] ?? 'g') === 'kg' ? $number * 1000 : $number;
            if ($grams <= 0 || floor($grams) !== $grams) {
                return null;
            }
            $weights[] = (int) $grams;
        }

        $weights = array_values(array_unique($weights));
        sort($weights);
        return $weights;
    }

    public function formatWeight(int $grams): string
    {
        if ($grams >= 1000) {
            $kilograms = rtrim(rtrim(number_format($grams / 1000, 2, ',', ''), '0'), ',');
            return $kilograms . ' kg';
        }
        return $grams . ' g';
    }
}
