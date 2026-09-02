<?php

namespace App\Controllers;

use App\Models\StockItem;
use App\Repositories\ProductRepositoryInterface;
use App\Repositories\StockRepositoryInterface;
use App\Services\StockService;
use Framework\Request;
use Framework\Response;
use Framework\ResponseFactory;
use Throwable;

class StockController
{
    public function __construct(
        private readonly ResponseFactory $responseFactory,
        private readonly StockRepositoryInterface $stockRepository,
        private readonly ProductRepositoryInterface $productRepository,
        private readonly StockService $stockService
    ) {
    }

    public function index(Request $request): Response
    {
        return $this->renderPage($request);
    }

    public function storeProduct(Request $request): Response
    {
        $name = trim($request->get('name') ?? '');
        $weightInput = trim($request->get('weights') ?? '');
        $weights = $this->stockService->parseWeights($weightInput);
        $errors = [];

        if ($name === '') {
            $errors['name'] = 'Vul een productnaam in.';
        } elseif (mb_strlen($name) > 100) {
            $errors['name'] = 'De productnaam mag maximaal 100 tekens bevatten.';
        } elseif ($this->productRepository->nameExists($name)) {
            $errors['name'] = 'Dit product bestaat al in de database.';
        }
        if ($weights === null) {
            $errors['weights'] = 'Gebruik gewichten zoals: 500g, 1kg, 2.5kg.';
        }

        if ($errors !== [] || $weights === null) {
            return $this->renderPage($request, $errors, [
                'name' => $name,
                'weights' => $weightInput,
            ]);
        }

        try {
            $this->productRepository->createWithWeights($name, $weights);
        } catch (Throwable) {
            return $this->renderPage(
                $request,
                ['general' => 'Het product kon niet worden opgeslagen. Probeer het opnieuw.'],
                ['name' => $name, 'weights' => $weightInput]
            );
        }

        $request->session->flash('success', 'Product en gewichtvarianten toegevoegd.');
        return $this->responseFactory->redirect('/stock');
    }

    public function update(Request $request): Response
    {
        $id = (int) ($request->get('id') ?? 0);
        $stockItem = $this->stockRepository->findById($id);
        if ($stockItem === null) {
            $request->session->flash('error', 'Deze voorraadregel bestaat niet.');
            return $this->responseFactory->redirect('/stock');
        }

        $values = [
            'current_stock' => trim($request->get('current_stock') ?? ''),
            'shelf_capacity' => trim($request->get('shelf_capacity') ?? ''),
            'units_per_batch' => trim($request->get('units_per_batch') ?? ''),
        ];
        foreach ($values as $value) {
            if (filter_var($value, FILTER_VALIDATE_INT) === false) {
                $request->session->flash('error', 'Gebruik alleen geldige gehele aantallen.');
                return $this->responseFactory->redirect('/stock');
            }
        }

        $errors = $this->stockService->validateStock(
            (int) $values['current_stock'],
            (int) $values['shelf_capacity'],
            (int) $values['units_per_batch']
        );
        if ($errors !== []) {
            $request->session->flash('error', implode(' ', $errors));
            return $this->responseFactory->redirect('/stock');
        }

        $stockItem->current_stock = (int) $values['current_stock'];
        $stockItem->shelf_capacity = (int) $values['shelf_capacity'];
        $stockItem->units_per_batch = (int) $values['units_per_batch'];
        $this->stockRepository->updateStock($stockItem);

        $request->session->flash(
            'success',
            $stockItem->product_name . ' (' . $this->stockService->formatWeight($stockItem->weight_grams) .
            ') is bijgewerkt.'
        );
        return $this->responseFactory->redirect('/stock');
    }

    /**
     * @param array<string, string> $errors
     * @param array{name: string, weights: string}|null $productForm
     */
    private function renderPage(Request $request, array $errors = [], ?array $productForm = null): Response
    {
        return $this->responseFactory->view('stock/index.html.twig', [
            'flash' => $request->session->getFlash(),
            'items' => $this->stockRows(),
            'errors' => $errors,
            'product_form' => $productForm ?? ['name' => '', 'weights' => ''],
        ]);
    }

    /** @return array<int, array{item: StockItem, advice: array<string, int>, weight_label: string}> */
    private function stockRows(): array
    {
        return array_map(
            fn (StockItem $item): array => [
                'item' => $item,
                'advice' => $this->stockService->calculateAdvice($item),
                'weight_label' => $this->stockService->formatWeight($item->weight_grams),
            ],
            $this->stockRepository->allWithProducts()
        );
    }
}
