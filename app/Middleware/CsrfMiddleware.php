<?php

namespace App\Middleware;

use App\Services\CsrfService;
use Framework\Request;
use Framework\Response;

class CsrfMiddleware
{
    public function __construct(
        private readonly CsrfService $csrfService
    ) {
    }

    /**
     * @throws \Exception
     */
    public function handle(Request $request, callable $next): Response
    {
        $session = $request->session;

        $this->csrfService->setSession($session);



        if ($request->method === 'POST') {
            $formToken = $request->get('csrf_token') ?? '';
            if (!$this->csrfService->validateToken($formToken)) {
                $response = new Response();
                $response->responseCode = 403;
                $response->body = 'Forbidden: Invalid CSRF token';
                return $response;
            }
        }

        return $next($request);
    }
}
