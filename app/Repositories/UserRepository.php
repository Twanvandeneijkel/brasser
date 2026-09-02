<?php

namespace App\Repositories;

use App\Models\User;

/**
 * @extends AbstractRepository<User>
 */
class UserRepository extends AbstractRepository implements UserRepositoryInterface
{
    protected string $tableName = 'users';
    protected string $className = User::class;
    public function findByUsername(string $username): ?User
    {
        $row = $this->database->run(
            'SELECT * FROM users WHERE username = :username',
            ['username' => $username]
        )->fetch();
        if (!$row) {
            return null;
        }

        return $this->fromDBRow($row);
    }
}
