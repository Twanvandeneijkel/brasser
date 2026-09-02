<?php

namespace App\Services;

use Exception;
use Framework\ResponseFactory;
use Framework\Session;
use Random\RandomException;

class CsrfService
{
    private const TOKEN_KEY = 'csrf_token';

    private ?Session $session = null;

    public function __construct(ResponseFactory $responseFactory)
    {
        $responseFactory->addFunction('csrf_token', function () {
            if (!$this->session) {
                throw new Exception('Session not set in CsrfService');
            }
            $token = $this->getToken($this->session);
            return htmlspecialchars($token, ENT_QUOTES, 'UTF-8');
        });

        $responseFactory->addStringFunction('csrf_input', function () {
            if (!$this->session) {
                throw new Exception('Session not set in CsrfService');
            }
            $token = $this->getToken($this->session);
            return '<input type="hidden" name="csrf_token" value="' .
                htmlspecialchars($token, ENT_QUOTES, 'UTF-8') . '">';
        });
    }

    public function setSession(Session $session): void
    {
        $this->session = $session;
    }

    /**
     * @throws Exception
     */
    public function validateToken(string $formToken): bool
    {
        if (!$this->session) {
            throw new Exception('Session not set in CsrfService');
        }
        $sessionToken = $this->session->get(self::TOKEN_KEY);
        if (!is_string($sessionToken)) {
            return false;
        }

        return hash_equals($sessionToken, $formToken);
    }

    /**
     * @throws RandomException
     */
    public function getToken(Session $session): string
    {
        $sessionToken = $session->get(self::TOKEN_KEY);
        if (is_string($sessionToken)) {
            return $sessionToken;
        }

        $newToken = bin2hex(random_bytes(32));
        $session->set(self::TOKEN_KEY, $newToken);
        return $newToken;
    }
}
