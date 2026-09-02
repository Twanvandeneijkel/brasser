<?php

namespace App\Controllers;

use Framework\Request;
use Framework\Response;
use Framework\ResponseFactory;

class HomeController
{
    private ResponseFactory $responseFactory;
    public function __construct(ResponseFactory $responseFactory)
    {
        $this->responseFactory = $responseFactory;
    }
    public function index(Request $request): Response
    {
        $flash = $request->session->getFlash();
        return $this->responseFactory->view('index.html.twig', ['flash' => $flash]);
    }
}
