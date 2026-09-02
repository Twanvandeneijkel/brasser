<?php

namespace Framework;

use PDO;
use PDOStatement;

class Database
{
    private PDO $connection;
    public function __construct(string $name)
    {
        $this->connection = new PDO("sqlite:" . $name);
        $this->connection->exec('PRAGMA foreign_keys = ON;');
        $this->connection->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $this->connection->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_OBJ);
    }

    public function getDriver(): string
    {
        return $this->connection->getAttribute(PDO::ATTR_DRIVER_NAME);
    }

    public function query(string $query): PDOStatement | false
    {
        return $this->connection->query($query);
    }

    /**
     * @param string $sql
     * @param array<string, bool|float|int|string|null>|null $params
     * @return PDOStatement
     */
    public function run(string $sql, ?array $params = null): PDOStatement
    {
        $stmt = $this->connection->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }

    public function prepare(string $sql): PDOStatement
    {
        return $this->connection->prepare($sql);
    }

    public function exec(string $sql): false|int
    {
        return $this->connection->exec($sql);
    }

    public function getLastID(string|null $field = null): int
    {
        return (int)$this->connection->lastInsertId($field);
    }

    public function migrate(string $migrationsDirectory): void
    {
        $files = scandir($migrationsDirectory);
        sort($files);
        if (!$files) {
            die('Could not read database migration files');
        }

        // Temporarily disable foreign key constraints for migrations
        $this->connection->exec('PRAGMA foreign_keys = OFF;');

        try {
            foreach ($files as $file) {
                if ($file === '.' || $file === '..') {
                    continue;
                }
                echo "Migrating: " . $file . "\n";
                if ($contents = file_get_contents($migrationsDirectory . $file)) {
                    // Split by semicolon and execute each statement separately
                    $statements = explode(';', $contents);
                    foreach ($statements as $statement) {
                        $statement = trim($statement);
                        if (!empty($statement)) {
                            try {
                                $this->connection->exec($statement);
                            } catch (\Exception $e) {
                                die("Error executing statement in '$file': " .
                                    $e->getMessage() .
                                    "\nStatement: " .
                                    substr($statement, 0, 100));
                            }
                        }
                    }
                }
            }
            echo "All migrations completed successfully!\n";
        } finally {
            // Re-enable foreign key constraints
            $this->connection->exec('PRAGMA foreign_keys = ON;');
        }
    }
}
