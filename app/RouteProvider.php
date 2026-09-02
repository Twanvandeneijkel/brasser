<?php

namespace App;

use App\Controllers\HomeController;
use App\Controllers\NutritionalValueController;
use App\Controllers\StockController;
use App\Controllers\UserController;
use App\Middleware\AuthMiddleware;
use App\Middleware\CsrfMiddleware;
use Exception;
use Framework\RouteProviderInterface;
use Framework\Router;
use Framework\ServiceContainer;

class RouteProvider implements RouteProviderInterface
{
    /**
     * @param Router $router
     * @param ServiceContainer $container
     * @return void
     * @throws Exception
     */
    public function register(Router $router, ServiceContainer $container): void
    {
        $authMiddleware = $container->get(AuthMiddleware::class);

        $homeController = $container->get(HomeController::class);
        $router->addRoute('GET', '/', [$homeController, 'index']);

        $userController = $container->get(UserController::class);
        $router->addRoute('GET', '/register', [$userController, 'registerForm']);
        $router->addRoute('POST', '/register', [$userController, 'register']);
        $router->addRoute('GET', '/login', [$userController, 'loginForm']);
        $router->addRoute('POST', '/login', [$userController, 'login']);
        $logoutRoute = $router->addRoute('POST', '/logout', [$userController, 'logout']);
        $logoutRoute->addMiddleware([$authMiddleware, 'requireAuth']);

        $stockController = $container->get(StockController::class);
        $stockIndexRoute = $router->addRoute('GET', '/stock', [$stockController, 'index']);
        $stockIndexRoute->addMiddleware([$authMiddleware, 'requireAuth']);
        $productStoreRoute = $router->addRoute('POST', '/stock/products', [$stockController, 'storeProduct']);
        $productStoreRoute->addMiddleware([$authMiddleware, 'requireAuth']);
        $stockUpdateRoute = $router->addRoute('POST', '/stock/(?<id>[1-9]\d*)/update', [$stockController, 'update']);
        $stockUpdateRoute->addMiddleware([$authMiddleware, 'requireAuth']);

        $nutritionController = $container->get(NutritionalValueController::class);
        $nutritionIndexRoute = $router->addRoute(
            'GET',
            '/nutritional-values',
            [$nutritionController, 'index']
        );
        $nutritionIndexRoute->addMiddleware([$authMiddleware, 'requireAuth']);
        $nutritionCalculateRoute = $router->addRoute(
            'POST',
            '/nutritional-values',
            [$nutritionController, 'calculate']
        );
        $nutritionCalculateRoute->addMiddleware([$authMiddleware, 'requireAuth']);

        $router->addMiddleware([$authMiddleware, 'handle']);

        $csrfMiddleware = $container->get(CsrfMiddleware::class);
        $router->addMiddleware([$csrfMiddleware, 'handle']);
    }
}
