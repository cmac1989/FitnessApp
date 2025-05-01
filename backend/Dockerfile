# Stage 1: Build PHP-FPM with Laravel dependencies
FROM php:8.2-fpm AS php-fpm

# Set working directory inside the container
WORKDIR /var/www

# Install PHP extensions
RUN apt-get update && apt-get install -y \
    build-essential \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    zip \
    unzip \
    git \
    curl \
    && docker-php-ext-install pdo_mysql gd

# Install Composer (PHP package manager)
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copy app files into the container's working directory
COPY . /var/www

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader

# Stage 2: Final image with nginx + PHP-FPM
FROM php:8.2-fpm

# Install nginx and supervisor in a separate step to reduce memory spikes
RUN apt-get update && apt-get install -y \
    nginx \
    supervisor

# Set working directory again
WORKDIR /var/www

# Copy the built Laravel app from the first stage
COPY --from=php-fpm /var/www /var/www

# Copy nginx config
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Copy supervisor config
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Expose the port Railway expects (8080)
EXPOSE 8080

# Set the correct permissions for storage/cache
RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache

# Start supervisord to run nginx and PHP-FPM together
CMD ["/usr/bin/supervisord", "-n"]
