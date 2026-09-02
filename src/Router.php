<?php

namespace Framework;

class Router
{
    private ResponseFactory $responseFactory;

    /** @var Route[] */
    private array $routes = [];

    /** @var array<callable> */
    private array $globalMiddleware = [];

    public function __construct(ResponseFactory $responseFactory)
    {
        $this->responseFactory = $responseFactory;
    }

    /**
     * Dispatch the Request to the appropriate route and return a Response.
     *
     * @param Request $request
     * @return Response
     */
    public function dispatch(Request $request): Response
    {
        foreach ($this->routes as $route) {
            if ($route->matches($request->method, $request->path)) {
                $request->routeParameters = $route->routeParameters;

                $pipeline = $this->buildMiddlewarePipeline($route);
                return $pipeline($request);
            }
        }

        // No matching route found, return a 404 response
        return $this->responseFactory->notFound();
    }

    /**
     * Add a new route to the router.
     *
     * @param string $method HTTP method
     * @param string $path URL path
     * @param callable $callback Callback function to handle the route
     * @return Route
     */
    public function addRoute(string $method, string $path, callable $callback): Route
    {
        $route = new Route($method, $path, $callback);
        $this->routes[] = $route;
        return $route;
    }

    public function addMiddleware(callable $middleware): void
    {
        $this->globalMiddleware[] = $middleware;
    }

    private function buildMiddlewarePipeline(Route $route): callable
    {
        $callback = $route->callback;
        $middlewareStack = array_reverse(array_merge($this->globalMiddleware, $route->middleware));

        $pipeline = function ($request) use ($callback) {
            return $callback($request);
        };

        foreach ($middlewareStack as $middleware) {
            $next = $pipeline;
            $pipeline = function ($request) use ($middleware, $next) {
                return $middleware($request, $next);
            };
        }
        return $pipeline;
    }
}
