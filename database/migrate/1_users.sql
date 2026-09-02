CREATE TABLE users
(
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    name     TEXT,
    role     TEXT DEFAULT 'user'
);
