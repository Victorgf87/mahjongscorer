-- Esquema inicial para Mahjong Scorer v2
DROP TABLE IF EXISTS plays;
CREATE TABLE plays (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    mode TEXT NOT NULL, -- MCR o Riichi
    input_text TEXT, -- Lo que dijo el usuario
    detected_hand TEXT, -- Lo que la IA interpretó
    base_points INTEGER, -- Puntos base
    final_score_tsumo INTEGER, -- Puntos calculados Tsumo
    final_score_ron INTEGER, -- Puntos calculados Ron
    ai_raw_response TEXT, -- JSON completo de la IA
    user_id TEXT -- Para futura funcionalidad premium (historial personal)
);

CREATE INDEX idx_plays_mode ON plays(mode);
CREATE INDEX idx_plays_timestamp ON plays(timestamp);
