```mermaid
erDiagram
  Run {
    integer score
    integer duration_seconds
    integer coins_collected
    timestamptz ended_at
  }
  LeaderboardEntry {
    text player_name
    integer score
    integer rank
    timestamptz achieved_at
  }
  Unlock {
    text unlock_type
    text title
    boolean is_equipped
    timestamptz unlocked_at
  }
```