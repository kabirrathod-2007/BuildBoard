CREATE DATABASE IF NOT EXISTS buildboard
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE buildboard;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  firebase_uid VARCHAR(128) NOT NULL,
  email VARCHAR(320) NOT NULL,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_firebase_uid (firebase_uid),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;


CREATE TABLE IF NOT EXISTS user_profiles (
  user_id BIGINT UNSIGNED NOT NULL,
  profile_data JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  CONSTRAINT fk_user_profiles_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS products (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug VARCHAR(191) NOT NULL,
  creator_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(150) NOT NULL,
  tagline VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  stage VARCHAR(50) NOT NULL DEFAULT 'Working prototype',
  audience TEXT NOT NULL,
  feedback_request TEXT NOT NULL,
  product_url VARCHAR(500) NOT NULL,
  github_url VARCHAR(500) DEFAULT NULL,
  image_url VARCHAR(500) DEFAULT NULL,
  gallery JSON DEFAULT NULL,
  video_url VARCHAR(500) DEFAULT NULL,
  is_sample BOOLEAN NOT NULL DEFAULT FALSE,
  enrollment_paused BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_products_slug (slug),
  KEY idx_products_creator_id (creator_id),
  CONSTRAINT fk_products_creator
    FOREIGN KEY (creator_id) REFERENCES users(id)
    ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS product_target_criteria (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id BIGINT UNSIGNED NOT NULL,
  criteria_type ENUM('category', 'role', 'industry', 'technology') NOT NULL,
  criteria_value VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_criteria_product (product_id, criteria_type),
  KEY idx_criteria_lookup (criteria_type, criteria_value),
  CONSTRAINT fk_product_criteria_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS product_test_steps (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id BIGINT UNSIGNED NOT NULL,
  step_order INT NOT NULL DEFAULT 1,
  instruction TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_test_steps_product (product_id, step_order),
  CONSTRAINT fk_product_test_steps_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS product_enrollments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_product_enrollment (user_id, product_id),
  KEY idx_enrollment_product (product_id),
  KEY idx_enrollment_user (user_id),
  CONSTRAINT fk_enrollments_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_enrollments_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;
