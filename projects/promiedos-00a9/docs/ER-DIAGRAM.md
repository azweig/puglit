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