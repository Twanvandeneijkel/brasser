<?php

namespace App\Services;

class NutritionalValueService
{
    /**
     * @param array<string, float|string> $values
     * @return array<string, float|string>
     */
    public function calculate(array $values): array
    {
        $factor = (float) $values['portion_grams'] / 100;
        $derivedKcal = ((float) $values['fat'] * 9)
            + ((float) $values['carbohydrates'] * 4)
            + ((float) $values['protein'] * 4);

        $result = $values;
        $result['energy_kcal'] = round($derivedKcal, 1);
        $result['energy_kj'] = round($derivedKcal * 4.184, 1);

        $portionFields = [
            'energy_kcal',
            'energy_kj',
            'fat',
            'saturates',
            'carbohydrates',
            'sugars',
            'protein',
            'salt',
        ];
        foreach ($portionFields as $key) {
            $result['portion_' . $key] = round((float) $result[$key] * $factor, 1);
        }

        $result['label'] = $this->createLabel($result);
        return $result;
    }

    /** @param array<string, float|string> $values */
    private function createLabel(array $values): string
    {
        return sprintf(
            "VOEDINGSWAARDE – %s\n" .
            "Per 100 g | Per portie (%s g)\n" .
            "Energie: %s kJ / %s kcal | %s kJ / %s kcal\n" .
            "Vetten: %s g | %s g\n" .
            "waarvan verzadigde vetzuren: %s g | %s g\n" .
            "Koolhydraten: %s g | %s g\n" .
            "waarvan suikers: %s g | %s g\n" .
            "Eiwitten: %s g | %s g\n" .
            "Zout: %s g | %s g",
            $values['product_name'],
            $values['portion_grams'],
            $values['energy_kj'],
            $values['energy_kcal'],
            $values['portion_energy_kj'],
            $values['portion_energy_kcal'],
            $values['fat'],
            $values['portion_fat'],
            $values['saturates'],
            $values['portion_saturates'],
            $values['carbohydrates'],
            $values['portion_carbohydrates'],
            $values['sugars'],
            $values['portion_sugars'],
            $values['protein'],
            $values['portion_protein'],
            $values['salt'],
            $values['portion_salt']
        );
    }

    /** @param array<string, float|string> $values
     * @return array<string, string>
     */
    public function validate(array $values): array
    {
        $errors = [];
        if (trim((string) $values['product_name']) === '') {
            $errors['product_name'] = 'Vul een productnaam in.';
        }
        if ((float) $values['portion_grams'] <= 0) {
            $errors['portion_grams'] = 'De portiegrootte moet groter zijn dan 0 gram.';
        }

        foreach (['fat', 'saturates', 'carbohydrates', 'sugars', 'protein', 'salt'] as $key) {
            if ((float) $values[$key] < 0) {
                $errors[$key] = 'Voedingswaarden kunnen niet negatief zijn.';
            }
        }
        if ((float) $values['saturates'] > (float) $values['fat']) {
            $errors['saturates'] = 'Verzadigd vet kan niet hoger zijn dan het totale vet.';
        }
        if ((float) $values['sugars'] > (float) $values['carbohydrates']) {
            $errors['sugars'] = 'Suikers kunnen niet hoger zijn dan de totale koolhydraten.';
        }

        return $errors;
    }
}
