# Use official PHP image with CLI for Laravel
FROM php:8.2-cli

# Set working directory inside the container
WORKDIR /var/www

# Install dependencies needed for Laravel and PHP extensions
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

# Expose the port Railway expects (8080)
EXPOSE 8080

# Start Laravel's built-in server and listen on $PORT environment variable
CMD php artisan serve --host=0.0.0.0 --port=$PORT
