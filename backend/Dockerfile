# Use official PHP-FPM image
FROM php:8.2-fpm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    nginx \
    supervisor \
    build-essential \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    zip \
    unzip \
    git \
    curl \
    procps \
    lsof \
    net-tools \
    && docker-php-ext-install pdo_mysql gd

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www

# Copy Laravel app files
COPY . /var/www

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader && \
    composer clear-cache

# Copy nginx and supervisor config files
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY docker/supervisord.conf /etc/supervisord.conf

# Set file permissions
RUN chown -R www-data:www-data /var/www && \
    chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache

# Expose Railway port
EXPOSE 8080

# Start supervisord to manage services
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
