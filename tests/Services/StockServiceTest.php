<?php

namespace Tests\Services;

use App\Models\StockItem;
use App\Services\StockService;
use PHPUnit\Framework\TestCase;

class StockServiceTest extends TestCase
{
    public function testItRoundsProductionUpToCompleteBatches(): void
    {
        $item = new StockItem();
        $item->current_stock = 3;
        $item->shelf_capacity = 20;
        $item->units_per_batch = 6;

        $advice = (new StockService())->calculateAdvice($item);

        self::assertSame(17, $advice['needed_units']);
        self::assertSame(3, $advice['batches']);
        self::assertSame(18, $advice['production_units']);
        self::assertSame(1, $advice['overflow']);
    }

    public function testItAdvisesNoProductionForAFullShelf(): void
    {
        $item = new StockItem();
        $item->current_stock = 20;
        $item->shelf_capacity = 20;
        $item->units_per_batch = 6;

        self::assertSame(0, (new StockService())->calculateAdvice($item)['production_units']);
    }

    public function testItRejectsImpossibleStockValues(): void
    {
        $errors = (new StockService())->validateStock(21, 20, 0);

        self::assertArrayHasKey('current_stock', $errors);
        self::assertArrayHasKey('units_per_batch', $errors);
    }

    public function testItParsesDifferentWeightFormats(): void
    {
        $weights = (new StockService())->parseWeights('500g, 1kg, 2.5kg, 1kg');

        self::assertSame([500, 1000, 2500], $weights);
    }

    public function testItRejectsInvalidWeights(): void
    {
        self::assertNull((new StockService())->parseWeights('500g, groot'));
    }
}
