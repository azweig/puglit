```mermaid
erDiagram
  Match {
    timestamptz date
    text team_home
    text team_away
    integer score_home
    integer score_away
  }
  Tournament {
    text name
    text season
    date start_date
    date end_date
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