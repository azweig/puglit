```mermaid
erDiagram
  Match {
    timestamptz date_time
    text team_home
    text team_away
    integer score_home
    integer score_away
  }
  Tournament {
    text name
    date start_date
    date end_date
    text current_stage
  }
  Standings {
    integer tournament_id
    text team_name
    integer points
    integer matches_played
    integer goal_difference
  }
  Scorer {
    text player_name
    text team_name
    integer goals
    integer tournament_id
  }
```