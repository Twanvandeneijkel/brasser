<?php

namespace Tests\Services;

use App\Services\NutritionalValueService;
use PHPUnit\Framework\TestCase;

class NutritionalValueServiceTest extends TestCase
{
    /** @return array<string, float|string> */
    private function values(): array
    {
        return [
            'product_name' => 'Testproduct',
            'portion_grams' => 50.0,
            'fat' => 15.0,
            'saturates' => 5.0,
            'carbohydrates' => 20.0,
            'sugars' => 10.0,
            'protein' => 5.0,
            'salt' => 1.0,
        ];
    }

    public function testItCalculatesEnergyAndPortionValues(): void
    {
        $result = (new NutritionalValueService())->calculate($this->values());

        self::assertSame(235.0, $result['energy_kcal']);
        self::assertSame(117.5, $result['portion_energy_kcal']);
        self::assertSame(7.5, $result['portion_fat']);
        self::assertStringContainsString('VOEDINGSWAARDE – Testproduct', (string) $result['label']);
    }

    public function testItRejectsInvalidSubtotals(): void
    {
        $values = $this->values();
        $values['saturates'] = 16.0;
        $values['sugars'] = 21.0;

        $errors = (new NutritionalValueService())->validate($values);

        self::assertArrayHasKey('saturates', $errors);
        self::assertArrayHasKey('sugars', $errors);
    }
}
