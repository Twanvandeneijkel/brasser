<?php

namespace App\Middleware;

use App\Services\AuthService;
use Framework\Request;
use Framework\Response;
use Framework\ResponseFactory;

class AuthMiddleware
{
    private AuthService $authService;

    private ResponseFactory $responseFactory;

    public function __construct(AuthService $authService, ResponseFactory $responseFactory)
    {
        $this->authService = $authService;
        $this->responseFactory = $responseFactory;
    }

    public function handle(Request $request, callable $next): Response
    {
        $request->setAttribute('previous_path', $request->session->get('last_path') ?? '/');

        $userId = $request->session->get('user_id');
        if ($userId) {
            $user = $this->authService->validateUser((int)$userId);
            if ($user) {
                $request->setAttribute('user', $user);
                $this->responseFactory->globalContext['user'] = $user;
            }
        }

        if ($request->method === 'GET' && $request->path !== '/users' && !str_starts_with($request->path, '/api/')) {
            $request->session->set('last_path', $request->path);
        }

        return $next($request);
    }

    public function requireAuth(Request $request, callable $next): Response
    {
        $user = $request->getAttribute('user');
        if (!$user) {
            $request->session->set('intended_path', $request->path);
            $request->session->flash('error', 'Log eerst in om deze pagina te bekijken.');
            return $this->responseFactory->redirect('/login');
        }

        return $next($request);
    }

    public function requireAdmin(Request $request, callable $next): Response
    {
        $user = $request->getAttribute('user');
        if (!$user || $user->role !== 'admin') {
            return $this->responseFactory->notAuthorized();
        }

        return $next($request);
    }
}
