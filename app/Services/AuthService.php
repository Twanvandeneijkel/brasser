<?php

namespace App\Services;

use App\Models\User;
use App\Repositories\UserRepositoryInterface;
use Framework\Session;
use RuntimeException;

class AuthService
{
    private UserRepositoryInterface $userRepository;

    public function __construct(UserRepositoryInterface $userRepository)
    {
        $this->userRepository = $userRepository;
    }

    public function register(User $user, string $password): User
    {
        $user->password = password_hash($password, PASSWORD_DEFAULT);
        $id = $this->userRepository->insert($user);
        $createdUser = $this->userRepository->findById($id);
        if ($createdUser === null) {
            throw new RuntimeException("User not found after registration (ID: $id)");
        }
        return $createdUser;
    }

    public function loginWithCredentials(string $username, string $password, Session $session): User|false
    {
        $user = $this->userRepository->findByUsername($username);
        if (!$user) {
            return false;
        }

        if (!password_verify($password, $user->password)) {
            return false;
        }

        $session->regenerate();

        $session->set('user_id', $user->id);
        return $user;
    }

    public function forceLogin(User $user, Session $session): void
    {
        $session->regenerate();
        $session->set('user_id', $user->id);
    }

    public function validateUser(int $userId): ?User
    {
        return $this->userRepository->findById($userId);
    }

    public function logout(Session $session): void
    {
        $session->clear('user_id');
        $session->regenerate();
    }
}
