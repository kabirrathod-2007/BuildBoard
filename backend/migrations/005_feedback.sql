USE buildboard;

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
