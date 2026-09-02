<?php

namespace App;

use App\Controllers\HomeController;
use App\Controllers\NutritionalValueController;
use App\Controllers\StockController;
use App\Controllers\UserController;
use App\Middleware\AuthMiddleware;
use App\Middleware\CsrfMiddleware;
use App\Repositories\ProductRepository;
use App\Repositories\ProductRepositoryInterface;
use App\Repositories\StockRepository;
use App\Repositories\StockRepositoryInterface;
use App\Repositories\UserRepository;
use App\Repositories\UserRepositoryInterface;
use App\Services\AuthService;
use App\Services\CsrfService;
use App\Services\NutritionalValueService;
use App\Services\StockService;
use Exception;
use Framework\Database;
use Framework\ResponseFactory;
use Framework\ServiceContainer;
use Framework\ServiceProviderInterface;

class ServiceProvider implements ServiceProviderInterface
{
    /**
     * @throws Exception
     */
    public function register(ServiceContainer $container): void
    {
        $responseFactory = $container->get(ResponseFactory::class);
        $database = $container->get(Database::class);

        $homeController = new HomeController($responseFactory);
        $container->set(HomeController::class, $homeController);

        $userRepository = new UserRepository($database);
        $container->set(UserRepositoryInterface::class, $userRepository);

        $authService = new AuthService($userRepository);
        $authMiddleware = new AuthMiddleware($authService, $responseFactory);
        $container->set(AuthMiddleware::class, $authMiddleware);

        $csrfService = new CsrfService($responseFactory);
        $csrfMiddleware = new CsrfMiddleware($csrfService);
        $container->set(CsrfMiddleware::class, $csrfMiddleware);

        $userController = new UserController($responseFactory, $userRepository, $authService);
        $container->set(UserController::class, $userController);

        $stockRepository = new StockRepository($database);
        $container->set(StockRepositoryInterface::class, $stockRepository);
        $productRepository = new ProductRepository($database);
        $container->set(ProductRepositoryInterface::class, $productRepository);
        $stockService = new StockService();
        $container->set(StockService::class, $stockService);
        $stockController = new StockController(
            $responseFactory,
            $stockRepository,
            $productRepository,
            $stockService
        );
        $container->set(StockController::class, $stockController);

        $nutritionalValueService = new NutritionalValueService();
        $container->set(NutritionalValueService::class, $nutritionalValueService);
        $nutritionalValueController = new NutritionalValueController(
            $responseFactory,
            $nutritionalValueService
        );
        $container->set(NutritionalValueController::class, $nutritionalValueController);
    }
}
