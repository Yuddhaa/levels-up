# Level Up Fitness 🎮💪

Level Up Fitness is a gamified fitness application that turns your workout journey into an RPG adventure. track your weight, nutrition, and habits to level up your character and unlock new stats!

## 🌟 Features

- **Gamified Tracking**: Earn XP for logging weight, water, and notes.
- **RPG Stats**: Track your Strength, Agility, and Endurance based on real workout data.
- **Visual Progress**: Beautiful charts and a character dashboard to visualize your gains.
- **Authentication**: Secure user accounts with JWT authentication.
- **Tech Stack**:
  - **Frontend**: React, TypeScript, Vite, Recharts, Framer Motion
  - **Backend**: Rust (Axum), SQLite, SQLx, Argon2

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- Rust (latest stable)
- SQLite3

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/level-up-fitness.git
    cd level-up-fitness
    ```

2.  **Setup Backend:**
    ```bash
    cd server
    # Create .env file
    echo "DATABASE_URL=sqlite:levelup.db" > .env
    echo "JWT_SECRET=your_super_secret_key" >> .env
    
    # Initialize Database
    cargo run --bin migrate # (If you have a migration script, or just run the server)
    cargo run --release
    ```

3.  **Setup Frontend:**
    ```bash
    cd client
    npm install
    
    # Create .env file
    echo "VITE_API_URL=http://localhost:3000" > .env
    
    # Start Development Server
    npm run dev
    ```

4.  **Open Application:**
    Navigate to `http://localhost:5173` in your browser.

## 🛠 Deployment

### Backend (Railway/Render)
1.  Connect your GitHub repository.
2.  Set Root Directory to `server`.
3.  Set Build Command: `cargo build --release` (or use Dockerfile).
4.  Adding `DATABASE_URL` and `JWT_SECRET` environment variables.
5.  **Important**: Use a Persistent Volume for `levelup.db` if using SQLite, or migrate to PostgreSQL.

### Frontend (Vercel)
1.  Connect your GitHub repository.
2.  Set Root Directory to `client`.
3.  Set Build Command: `npm run build`.
4.  Set Output Directory: `dist`.
5.  Add `VITE_API_URL` environment variable pointing to your deployed backend.

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## 📝 License

[MIT](https://choosealicense.com/licenses/mit/)
