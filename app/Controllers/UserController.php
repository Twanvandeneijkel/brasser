<?php

namespace App\Controllers;

use App\Models\User;
use App\Repositories\UserRepositoryInterface;
use App\Services\AuthService;
use Framework\Request;
use Framework\Response;
use Framework\ResponseFactory;
use Throwable;

class UserController
{
    public function __construct(
        private readonly ResponseFactory $responseFactory,
        private readonly UserRepositoryInterface $userRepository,
        private readonly AuthService $authService
    ) {
    }

    public function registerForm(Request $request): Response
    {
        if ($request->getAttribute('user') instanceof User) {
            return $this->responseFactory->redirect('/stock');
        }

        return $this->responseFactory->view('users/register.html.twig', [
            'flash' => $request->session->getFlash(),
        ]);
    }

    public function loginForm(Request $request): Response
    {
        if ($request->getAttribute('user') instanceof User) {
            return $this->responseFactory->redirect('/stock');
        }

        return $this->responseFactory->view('users/login.html.twig', [
            'flash' => $request->session->getFlash(),
        ]);
    }

    public function login(Request $request): Response
    {
        if ($request->getAttribute('user') instanceof User) {
            return $this->responseFactory->redirect('/stock');
        }

        $username = trim($request->get('username') ?? '');
        $password = $request->get('password') ?? '';
        $errors = [];

        if ($username === '') {
            $errors['username'] = 'Gebruikersnaam is verplicht.';
        }
        if ($password === '') {
            $errors['password'] = 'Wachtwoord is verplicht.';
        }

        try {
            if ($errors === [] && !$this->authService->loginWithCredentials($username, $password, $request->session)) {
                $errors['general'] = 'De gebruikersnaam of het wachtwoord is onjuist.';
            }
        } catch (Throwable) {
            $errors['general'] = 'Inloggen is tijdelijk niet gelukt. Probeer het opnieuw.';
        }

        if ($errors !== []) {
            return $this->responseFactory->view('users/login.html.twig', [
                'errors' => $errors,
                'username' => $username,
            ]);
        }

        $request->session->flash('success', "Welkom terug, $username.");
        $intendedPath = $request->session->get('intended_path');
        $request->session->clear('intended_path');
        return $this->responseFactory->redirect($intendedPath ?? '/stock');
    }

    public function register(Request $request): Response
    {
        if ($request->getAttribute('user') instanceof User) {
            return $this->responseFactory->redirect('/stock');
        }

        $name = trim($request->get('name') ?? '');
        $username = trim($request->get('username') ?? '');
        $password = $request->get('password') ?? '';
        $confirmPassword = $request->get('confirm_password') ?? '';
        $errors = [];

        if ($name === '') {
            $errors['name'] = 'Naam is verplicht.';
        } elseif (mb_strlen($name) > 100) {
            $errors['name'] = 'Naam mag maximaal 100 tekens bevatten.';
        }
        if ($username === '') {
            $errors['username'] = 'Gebruikersnaam is verplicht.';
        } elseif (!preg_match('/^[a-zA-Z0-9._-]{3,30}$/', $username)) {
            $errors['username'] = 'Gebruik 3–30 letters, cijfers, punten, streepjes of underscores.';
        } elseif ($this->userRepository->findByUsername($username) !== null) {
            $errors['username'] = 'Deze gebruikersnaam is al in gebruik.';
        }
        if ($password === '') {
            $errors['password'] = 'Wachtwoord is verplicht.';
        } elseif (strlen($password) < 8) {
            $errors['password'] = 'Gebruik minimaal 8 tekens voor je wachtwoord.';
        }
        if ($confirmPassword === '') {
            $errors['confirm_password'] = 'Bevestig je wachtwoord.';
        } elseif ($password !== $confirmPassword) {
            $errors['confirm_password'] = 'De wachtwoorden komen niet overeen.';
        }

        if ($errors !== []) {
            return $this->responseFactory->view('users/register.html.twig', [
                'errors' => $errors,
                'name' => $name,
                'username' => $username,
            ]);
        }

        try {
            $user = new User();
            $user->name = $name;
            $user->username = $username;
            $createdUser = $this->authService->register($user, $password);
            $this->authService->forceLogin($createdUser, $request->session);
        } catch (Throwable) {
            return $this->responseFactory->view('users/register.html.twig', [
                'errors' => ['general' => 'Registreren is tijdelijk niet gelukt. Probeer het opnieuw.'],
                'name' => $name,
                'username' => $username,
            ]);
        }

        $request->session->flash('success', 'Je account is aangemaakt. Welkom!');
        return $this->responseFactory->redirect('/stock');
    }

    public function logout(Request $request): Response
    {
        $this->authService->logout($request->session);
        $request->session->flash('success', 'Je bent veilig uitgelogd.');
        return $this->responseFactory->redirect('/');
    }
}
