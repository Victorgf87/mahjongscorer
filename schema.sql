-- Esquema v2: Autenticación Magic Link
DROP TABLE IF EXISTS plays;
CREATE TABLE plays (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    mode TEXT NOT NULL,
    input_text TEXT,
    ai_raw_response TEXT,
    user_id TEXT -- UUID o Email
);

DROP TABLE IF EXISTS users;
CREATE TABLE users (
    email TEXT PRIMARY KEY,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_premium BOOLEAN DEFAULT 0
);

DROP TABLE IF EXISTS auth_tokens;
CREATE TABLE auth_tokens (
    token TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    expires_at DATETIME NOT NULL
);

CREATE INDEX idx_plays_user ON plays(user_id);
CREATE INDEX idx_tokens_email ON auth_tokens(email);
