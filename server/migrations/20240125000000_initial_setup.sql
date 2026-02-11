-- Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    current_weight REAL DEFAULT 0,
    start_weight REAL DEFAULT 0,
    target_weight REAL DEFAULT 0,
    height REAL DEFAULT 0,
    age INTEGER DEFAULT 0,
    gender TEXT DEFAULT 'Unknown',
    level INTEGER DEFAULT 1,
    aura INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
