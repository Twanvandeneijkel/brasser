FROM php:apache

RUN apt-get update \
    && apt-get install -y libsqlite3-dev \
    && docker-php-ext-install pdo_sqlite \
    && rm -rf /var/lib/apt/lists/*

RUN sed -i 's|/var/www/html|/var/www/html/public|g' \
    /etc/apache2/sites-available/000-default.conf \
    /etc/apache2/apache2.conf

RUN a2enmod rewrite

RUN sed -i 's|AllowOverride None|AllowOverride All|g' /etc/apache2/apache2.conf