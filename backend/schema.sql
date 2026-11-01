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

CREATE TABLE IF NOT EXISTS product_feedback (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  category VARCHAR(50) NOT NULL,
  experience TEXT NOT NULL,
  likes TEXT DEFAULT NULL,
  is_helpful BOOLEAN NOT NULL DEFAULT FALSE,
  helpful_marked_at TIMESTAMP NULL DEFAULT NULL,
  builder_reply JSON DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_feedback_product (product_id, created_at),
  KEY idx_feedback_user (user_id, created_at),
  KEY idx_feedback_helpful (user_id, is_helpful),
  CONSTRAINT fk_feedback_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_feedback_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS problems (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug VARCHAR(191) NOT NULL,
  creator_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  statement TEXT NOT NULL,
  workarounds TEXT DEFAULT NULL,
  target_audience VARCHAR(255) DEFAULT NULL,
  proposed_concept TEXT DEFAULT NULL,
  category VARCHAR(100) NOT NULL DEFAULT 'Developer Tools',
  stage VARCHAR(50) NOT NULL DEFAULT 'Validating Need',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_problems_slug (slug),
  KEY idx_problems_creator_id (creator_id),
  KEY idx_problems_category (category),
  KEY idx_problems_created_at (created_at),
  CONSTRAINT fk_problems_creator
    FOREIGN KEY (creator_id) REFERENCES users(id)
    ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS problem_target_criteria (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  problem_id BIGINT UNSIGNED NOT NULL,
  criteria_type ENUM('role', 'industry') NOT NULL,
  criteria_value VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_problem_criteria_problem (problem_id, criteria_type),
  CONSTRAINT fk_problem_criteria_problem
    FOREIGN KEY (problem_id) REFERENCES problems(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS problem_validations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  problem_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_problem_user_validation (problem_id, user_id),
  KEY idx_problem_validations_problem (problem_id),
  KEY idx_problem_validations_user (user_id),
  CONSTRAINT fk_problem_validations_problem
    FOREIGN KEY (problem_id) REFERENCES problems(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_problem_validations_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS problem_tester_signups (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  problem_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_problem_user_signup (problem_id, user_id),
  KEY idx_problem_signups_problem (problem_id),
  KEY idx_problem_signups_user (user_id),
  CONSTRAINT fk_problem_signups_problem
    FOREIGN KEY (problem_id) REFERENCES problems(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_problem_signups_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS problem_comments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  problem_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  parent_id BIGINT UNSIGNED DEFAULT NULL,
  reply_to_author VARCHAR(100) DEFAULT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_problem_comments_problem (problem_id, created_at),
  KEY idx_problem_comments_parent (parent_id),
  KEY idx_problem_comments_user (user_id),
  CONSTRAINT fk_problem_comments_problem
    FOREIGN KEY (problem_id) REFERENCES problems(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_problem_comments_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_problem_comments_parent
    FOREIGN KEY (parent_id) REFERENCES problem_comments(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS problem_solutions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  problem_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED DEFAULT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,
  product_url VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_problem_solutions_problem (problem_id),
  KEY idx_problem_solutions_user (user_id),
  KEY idx_problem_solutions_product (product_id),
  CONSTRAINT fk_problem_solutions_problem
    FOREIGN KEY (problem_id) REFERENCES problems(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_problem_solutions_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_problem_solutions_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE SET NULL
) ENGINE=InnoDB;
