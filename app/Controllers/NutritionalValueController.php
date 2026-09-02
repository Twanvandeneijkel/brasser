<?php

namespace App\Controllers;

use App\Services\NutritionalValueService;
use Framework\Request;
use Framework\Response;
use Framework\ResponseFactory;

class NutritionalValueController
{
    private const NUMERIC_FIELDS = [
        'portion_grams',
        'fat',
        'saturates',
        'carbohydrates',
        'sugars',
        'protein',
        'salt',
    ];

    public function __construct(
        private readonly ResponseFactory $responseFactory,
        private readonly NutritionalValueService $nutritionalValueService
    ) {
    }

    public function index(Request $request): Response
    {
        return $this->responseFactory->view('nutrition/index.html.twig', [
            'flash' => $request->session->getFlash(),
            'form' => $this->defaults(),
        ]);
    }

    public function calculate(Request $request): Response
    {
        $form = ['product_name' => trim($request->get('product_name') ?? '')];
        $errors = [];
        foreach (self::NUMERIC_FIELDS as $field) {
            $form[$field] = str_replace(',', '.', trim($request->get($field) ?? ''));
            if ($form[$field] === '' || !is_numeric($form[$field])) {
                $errors[$field] = 'Vul een geldig getal in.';
            }
        }

        if ($errors === []) {
            $errors = $this->nutritionalValueService->validate($form);
        }

        return $this->responseFactory->view('nutrition/index.html.twig', [
            'form' => $form,
            'errors' => $errors,
            'result' => $errors === [] ? $this->nutritionalValueService->calculate($form) : null,
        ]);
    }

    /** @return array<string, string> */
    private function defaults(): array
    {
        return [
            'product_name' => '',
            'portion_grams' => '100',
            'fat' => '0',
            'saturates' => '0',
            'carbohydrates' => '0',
            'sugars' => '0',
            'protein' => '0',
            'salt' => '0',
        ];
    }
}
