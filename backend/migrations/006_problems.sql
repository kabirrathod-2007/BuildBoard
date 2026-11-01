USE buildboard;

-- ----------------------------------------------------------------------
-- Milestone 5: Pre-Build Problem Validation & Discussion Hub
-- ----------------------------------------------------------------------

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
