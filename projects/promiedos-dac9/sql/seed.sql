-- Promiedos — multi-country catalog seed. Real leagues/teams; live data relative to NOW().
TRUNCATE goal_scorers, standings, matches, tournaments RESTART IDENTITY CASCADE;

INSERT INTO tournaments (id, name, country, flag, season, current_round) VALUES
(1, 'Liga Profesional', 'Argentina', '🇦🇷', '2026', 14),
(2, 'Brasileirão Série A', 'Brasil', '🇧🇷', '2026', 16),
(3, 'Premier League', 'Inglaterra', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', '2025/26', 22),
(4, 'LaLiga', 'España', '🇪🇸', '2025/26', 21),
(5, 'Serie A', 'Italia', '🇮🇹', '2025/26', 20),
(6, 'Copa Libertadores', 'CONMEBOL', '🏆', '2026', 3);

-- LIVE + today + upcoming + finished, per league
INSERT INTO matches (tournament_id, date, team_home, team_away, score_home, score_away, status) VALUES
-- Argentina
(1, NOW() - INTERVAL '38 minutes', 'River Plate', 'Boca Juniors', 1, 0, 'live'),
(1, NOW() - INTERVAL '20 minutes', 'Racing Club', 'Independiente', 2, 2, 'live'),
(1, NOW() - INTERVAL '3 hours', 'San Lorenzo', 'Vélez Sarsfield', 0, 1, 'finished'),
(1, NOW() + INTERVAL '3 hours', 'Talleres', 'Lanús', 0, 0, 'scheduled'),
(1, NOW() + INTERVAL '1 day', 'Rosario Central', 'Newell''s Old Boys', 0, 0, 'scheduled'),
-- Brasil
(2, NOW() - INTERVAL '25 minutes', 'Flamengo', 'Palmeiras', 2, 1, 'live'),
(2, NOW() - INTERVAL '2 hours', 'Corinthians', 'São Paulo', 1, 1, 'finished'),
(2, NOW() + INTERVAL '5 hours', 'Grêmio', 'Internacional', 0, 0, 'scheduled'),
(2, NOW() + INTERVAL '2 days', 'Fluminense', 'Botafogo', 0, 0, 'scheduled'),
-- Inglaterra
(3, NOW() - INTERVAL '12 minutes', 'Arsenal', 'Manchester City', 0, 0, 'live'),
(3, NOW() - INTERVAL '4 hours', 'Liverpool', 'Manchester United', 3, 1, 'finished'),
(3, NOW() + INTERVAL '1 day', 'Chelsea', 'Tottenham', 0, 0, 'scheduled'),
(3, NOW() + INTERVAL '2 days', 'Newcastle', 'Aston Villa', 0, 0, 'scheduled'),
-- España
(4, NOW() - INTERVAL '55 minutes', 'Real Madrid', 'Barcelona', 2, 2, 'live'),
(4, NOW() - INTERVAL '1 hour', 'Atlético Madrid', 'Sevilla', 1, 0, 'finished'),
(4, NOW() + INTERVAL '6 hours', 'Real Sociedad', 'Athletic Club', 0, 0, 'scheduled'),
(4, NOW() + INTERVAL '1 day', 'Valencia', 'Villarreal', 0, 0, 'scheduled'),
-- Italia
(5, NOW() - INTERVAL '30 minutes', 'Inter', 'Milan', 1, 1, 'live'),
(5, NOW() - INTERVAL '5 hours', 'Juventus', 'Napoli', 2, 0, 'finished'),
(5, NOW() + INTERVAL '1 day', 'Roma', 'Lazio', 0, 0, 'scheduled'),
-- Libertadores
(6, NOW() - INTERVAL '15 minutes', 'River Plate', 'Flamengo', 0, 1, 'live'),
(6, NOW() + INTERVAL '1 day', 'Palmeiras', 'Boca Juniors', 0, 0, 'scheduled');

INSERT INTO standings (tournament_id, team_name, points, played, won, drawn, lost, gf, ga) VALUES
(1, 'River Plate', 30, 13, 9, 3, 1, 26, 10),
(1, 'Boca Juniors', 27, 13, 8, 3, 2, 22, 12),
(1, 'Racing Club', 24, 13, 7, 3, 3, 19, 14),
(1, 'San Lorenzo', 22, 13, 6, 4, 3, 16, 13),
(1, 'Talleres', 21, 13, 6, 3, 4, 18, 15),
(1, 'Vélez Sarsfield', 19, 13, 5, 4, 4, 14, 13),
(2, 'Flamengo', 35, 16, 11, 2, 3, 31, 14),
(2, 'Palmeiras', 33, 16, 10, 3, 3, 28, 13),
(2, 'Botafogo', 30, 16, 9, 3, 4, 25, 16),
(2, 'Corinthians', 26, 16, 7, 5, 4, 20, 17),
(3, 'Manchester City', 50, 22, 16, 2, 4, 52, 22),
(3, 'Arsenal', 49, 22, 15, 4, 3, 45, 19),
(3, 'Liverpool', 47, 22, 14, 5, 3, 48, 24),
(3, 'Chelsea', 41, 22, 12, 5, 5, 39, 26),
(4, 'Real Madrid', 55, 21, 18, 1, 2, 50, 18),
(4, 'Barcelona', 51, 21, 16, 3, 2, 53, 22),
(4, 'Atlético Madrid', 46, 21, 14, 4, 3, 38, 19),
(4, 'Athletic Club', 40, 21, 12, 4, 5, 33, 22),
(5, 'Inter', 51, 20, 16, 3, 1, 47, 16),
(5, 'Napoli', 48, 20, 15, 3, 2, 41, 17),
(5, 'Juventus', 44, 20, 13, 5, 2, 36, 18),
(5, 'Milan', 40, 20, 12, 4, 4, 35, 23),
(6, 'Flamengo', 7, 3, 2, 1, 0, 6, 2),
(6, 'River Plate', 6, 3, 2, 0, 1, 5, 3),
(6, 'Palmeiras', 5, 3, 1, 2, 0, 4, 2),
(6, 'Boca Juniors', 4, 3, 1, 1, 1, 3, 3);

INSERT INTO goal_scorers (tournament_id, player_name, team_name, goals) VALUES
(1, 'Miguel Borja', 'River Plate', 12),
(1, 'Edinson Cavani', 'Boca Juniors', 10),
(1, 'Adrián Martínez', 'Racing Club', 9),
(2, 'Pedro', 'Flamengo', 15),
(2, 'Flaco López', 'Palmeiras', 13),
(2, 'Tiquinho Soares', 'Botafogo', 11),
(3, 'Erling Haaland', 'Manchester City', 19),
(3, 'Mohamed Salah', 'Liverpool', 16),
(3, 'Bukayo Saka', 'Arsenal', 12),
(4, 'Robert Lewandowski', 'Barcelona', 18),
(4, 'Kylian Mbappé', 'Real Madrid', 17),
(4, 'Julián Álvarez', 'Atlético Madrid', 13),
(5, 'Lautaro Martínez', 'Inter', 16),
(5, 'Victor Osimhen', 'Napoli', 14),
(6, 'Pedro', 'Flamengo', 4),
(6, 'Miguel Borja', 'River Plate', 3);
