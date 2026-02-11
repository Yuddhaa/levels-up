-- Create Favorites table
CREATE TABLE IF NOT EXISTS favorite_foods (
    user_id INTEGER NOT NULL,
    food_item_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, food_item_id),
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(food_item_id) REFERENCES food_items(id)
);
