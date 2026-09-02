<?php

namespace App\Middleware;

use Framework\Request;
use Framework\Response;

class AccessMiddleware
{
    public function __construct()
    {
    }

    public function handle(Request $request, callable $next): Response
    {
//        if (rand(0, 1) === 0) {
//            return new Response("Access Denied", 403);
//        }
        $response = $next($request);
        $response->body = str_replace("Taskey", "Tasketty", $response->body);
        return $response;
    }
}
