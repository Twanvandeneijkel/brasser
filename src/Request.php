<?php

namespace Framework;

class Request
{
    public string $method;

    public string $path;

    /** @var array<string|string[]> */
    public array $postParameters;

    /** @var string[] */
    public array $queryParameters;

    /** @var string[] */
    public array $routeParameters = [];

    /** @var array<string, mixed> */
    public array $attributes = [];

    public Session $session;

    /**
     * @param string $method
     * @param string $path
     * @param string[] $queryParameters
     * @param array<string|string[]> $postParameters
     */
    public function __construct(string $method, string $path, array $queryParameters, array $postParameters)
    {
        $this->method = $method;
        $this->path = $path;
        $this->queryParameters = $queryParameters;
        $this->postParameters = $postParameters;
        $this->session = new Session();
    }

    /**
     * @param string $key
     * @return string|null
     */
    public function get(string $key): string|null
    {
        if (array_key_exists($key, $this->routeParameters)) {
            return $this->routeParameters[$key];
        }
        if (array_key_exists($key, $this->postParameters)) {
            if (is_array($this->postParameters[$key])) {
                return $this->postParameters[$key][0];
            }
            return $this->postParameters[$key];
        }
        if (array_key_exists($key, $this->queryParameters)) {
            return $this->queryParameters[$key];
        }
        return null;
    }

    public function setAttribute(string $key, mixed $value): void
    {
        $this->attributes[$key] = $value;
    }

     /**
      * @param string $key
      * @return mixed|null
      */
    public function getAttribute(string $key): mixed
    {
        if (array_key_exists($key, $this->attributes)) {
            return $this->attributes[$key];
        }
        return null;
    }

    /**
     * @param string $key
     * @return string[]|null
     */
    public function getMany(string $key): ?array
    {
        if (array_key_exists($key, $this->postParameters)) {
            if (is_array($this->postParameters[$key])) {
                return $this->postParameters[$key];
            }
            return array($this->postParameters[$key]);
        }
        return null;
    }
}
