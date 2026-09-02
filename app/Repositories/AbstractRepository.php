<?php

namespace App\Repositories;

use App\Models\AbstractModel;
use Exception;
use Framework\Database;

/**
 * @template T of AbstractModel
 */
abstract class AbstractRepository
{
    protected Database $database;
    protected string $tableName;
    protected string $className;

    /** @var array<string> */
    protected array $columnNames;

    /**
     * @throws Exception
     */
    public function __construct(Database $database)
    {
        $this->database = $database;
        $this->columnNames = $this->getColumnNames($this->tableName);
    }

    /**
     * @param string $tableName
     * @return array<string>
     * @throws Exception
     */
    private function getColumnNames(string $tableName): array
    {
        $statement = $this->database->run("
            SELECT name
            FROM sqlite_master
            WHERE type = 'table'
            AND name
            NOT LIKE 'sqlite_%'");
        $tables = [];
        foreach ($statement as $row) {
            $tables[] = $row->name;
        }
        if (!in_array($tableName, $tables, true)) {
            throw new Exception("Table named $tableName does not exist");
        }
        $stmt = $this->database->run("SELECT name FROM pragma_table_info('$tableName')");
        $columnNames = [];
        foreach ($stmt as $row) {
            $columnNames[] = $row->name;
        }

        return $columnNames;
    }

    /**
     * @return array<object>
     */
    public function all(): array
    {
        $rows = $this->database->run("SELECT * FROM $this->tableName ORDER BY id")->fetchAll();

        $items = [];

        foreach ($rows as $row) {
            $items[] = $this->fromDBRow($row);
        }

        return $items;
    }

    /**
     * @param object $row
     * @return T
     */
    protected function fromDBRow(object $row)
    {
        /** @var T $object */
        $object = new $this->className();

        foreach ($this->columnNames as $column) {
            $object->{$column} = $row->{$column};
        }

        return $object;
    }

    public function findById(int $id): ?object
    {
        $row = $this->database->run("SELECT * FROM $this->tableName WHERE id = :id", ['id' => $id])->fetch();

        if (!$row) {
            return null;
        }

        return $this->fromDBRow($row);
    }

    public function delete(int $id): void
    {
        $this->database->run("DELETE FROM $this->tableName WHERE id = :id", ['id' => $id]);
    }

    /**
     * @param T $entity
     */
    public function update(AbstractModel $entity): void
    {
        $setParts = [];
        $params = [];

        foreach ($this->columnNames as $column) {
            if ($column === 'id') {
                continue;
            }

            if (!property_exists($entity, $column)) {
                continue;
            }

            /** @var mixed $value */
            $value = $entity->$column;
            $setParts[] = "$column = :$column";
            $params[$column] = $value;
        }

        $id = $entity->id;
        $params['id'] = $id;

        $sql = "UPDATE {$this->tableName}
        SET " . implode(', ', $setParts) . "
        WHERE id = :id";

        $this->database->run($sql, $params);
    }

    public function insert(AbstractModel $entity): int
    {
        $columns = [];
        $placeholders = [];
        $params = [];

        foreach ($this->columnNames as $column) {
            // Skip auto-increment ID
            if ($column === 'id') {
                continue;
            }

            if (!property_exists($entity, $column)) {
                continue;
            }

            $columns[] = $column;
            $placeholders[] = ':' . $column;
            $params[$column] = $entity->{$column};
        }
        $sql = "INSERT INTO $this->tableName (" . implode(', ', $columns) . ")
        VALUES (" . implode(', ', $placeholders) . ")";

        $this->database->run($sql, $params);

        $lastId = $this->database->getLastId();
        $entity->id = $lastId;
        return $lastId;
    }
}
