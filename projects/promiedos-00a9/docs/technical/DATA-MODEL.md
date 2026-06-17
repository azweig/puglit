# Data Model

## Entity-Relationship Diagram
```mermaid
erDiagram
  Match {
    timestamptz match_date
    text home_team
    text away_team
    text score
  }
  Tournament {
    text name
    date start_date
    date end_date
    text type
  }
  Standings {
    integer tournament_id
    text team_name
    integer points
    integer matches_played
  }
  GoalScorer {
    text player_name
    text team_name
    integer goals
    integer tournament_id
  }
```

## Entity Descriptions
- **Match**: Represents a football match with details on the date, teams involved, and score.
- **Tournament**: Contains information about a football tournament, including its name, duration, and type (league, cup, friendly).
- **Standings**: Tracks the performance of teams in a tournament, including points and matches played.
- **GoalScorer**: Records the top goal scorers in a tournament, associating players with their teams and goal counts.