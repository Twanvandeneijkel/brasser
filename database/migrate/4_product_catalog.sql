CREATE TABLE products
(
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE product_variants
(
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id   INTEGER NOT NULL,
    weight_grams INTEGER NOT NULL,
    UNIQUE (product_id, weight_grams),
    FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
);

CREATE TABLE stock_items
(
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    product_variant_id INTEGER NOT NULL UNIQUE,
    current_stock      INTEGER NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
    shelf_capacity     INTEGER NOT NULL DEFAULT 1 CHECK (shelf_capacity >= 1),
    units_per_batch    INTEGER NOT NULL DEFAULT 1 CHECK (units_per_batch >= 1),
    updated_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_variant_id) REFERENCES product_variants (id) ON DELETE CASCADE
);

INSERT INTO products (name)
VALUES ('Volkoren tarwemeel'),
       ('Speltpittenbrood');

INSERT INTO product_variants (product_id, weight_grams)
VALUES ((SELECT id FROM products WHERE name = 'Volkoren tarwemeel'), 1000),
       ((SELECT id FROM products WHERE name = 'Volkoren tarwemeel'), 2500),
       ((SELECT id FROM products WHERE name = 'Volkoren tarwemeel'), 5000),
       ((SELECT id FROM products WHERE name = 'Speltpittenbrood'), 500),
       ((SELECT id FROM products WHERE name = 'Speltpittenbrood'), 1000),
       ((SELECT id FROM products WHERE name = 'Speltpittenbrood'), 2500);

INSERT INTO stock_items (product_variant_id)
SELECT id FROM product_variants;
