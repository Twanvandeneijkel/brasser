<?php

namespace App\Repositories;

use App\Models\User;

interface UserRepositoryInterface
{
    /** @return User[] */
    public function all(): array;

    /** @return ?User */
    public function findById(int $id): ?object;
    public function delete(int $id): void;
    public function insert(User $entity): int;
    public function findByUsername(string $username): ?User;
    public function update(User $entity): void;
}
