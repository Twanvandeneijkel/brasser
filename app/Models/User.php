<?php

namespace App\Models;

class User extends AbstractModel
{
    public string $name;

    public string $username;

    public string $password;

    public string $role = 'user';
}
