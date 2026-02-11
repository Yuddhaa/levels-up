-- Create Food Items table
CREATE TABLE food_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    calories INTEGER NOT NULL,
    protein REAL DEFAULT 0.0,
    carbs REAL DEFAULT 0.0,
    fat REAL DEFAULT 0.0,
    serving_unit TEXT DEFAULT 'g',
    serving_size REAL DEFAULT 100.0,
    created_by_user_id INTEGER, -- NULL for system foods
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed some basic foods
INSERT INTO food_items (name, calories, protein, carbs, fat, serving_unit, serving_size) VALUES
('Egg (Large)', 78, 6.3, 0.6, 5.3, 'piece', 1.0),
('Chicken Breast (Cooked)', 165, 31.0, 0.0, 3.6, 'g', 100.0),
('White Rice (Cooked)', 130, 2.7, 28.0, 0.3, 'g', 100.0),
('Oatmeal (Cooked)', 71, 2.5, 12.0, 1.5, 'g', 100.0),
('Banana', 89, 1.1, 22.8, 0.3, 'medium', 1.0),
('Apple', 52, 0.3, 14.0, 0.2, 'medium', 1.0),
('Greek Yogurt', 59, 10.0, 3.6, 0.4, 'g', 100.0),
('Avocado', 160, 2.0, 8.5, 14.7, 'medium', 1.0),
('Salmon (Cooked)', 208, 20.0, 0.0, 13.0, 'g', 100.0),
('Sweet Potato (Baked)', 90, 2.0, 20.7, 0.1, 'g', 100.0),
('Broccoli (Steamed)', 35, 2.4, 7.2, 0.4, 'g', 100.0),
('Almonds', 579, 21.2, 21.6, 49.9, 'g', 100.0),
('Whey Protein Scoop', 120, 24.0, 3.0, 1.5, 'scoop', 1.0),
('Whole Milk', 61, 3.2, 4.8, 3.2, 'ml', 100.0),
('Bread (Whole Wheat)', 247, 13.0, 41.0, 3.4, 'slice', 1.0);

-- Create Meal Logs table
CREATE TABLE meal_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL DEFAULT 1,
    date DATE NOT NULL,
    meal_type TEXT NOT NULL, -- 'breakfast', 'lunch', 'dinner', 'snack'
    food_item_id INTEGER, -- Optional link to food_items
    food_name TEXT NOT NULL,
    calories INTEGER NOT NULL,
    protein REAL DEFAULT 0.0,
    carbs REAL DEFAULT 0.0,
    fat REAL DEFAULT 0.0,
    servings REAL DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(food_item_id) REFERENCES food_items(id)
);
