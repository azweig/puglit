# Data Model

## ER Diagram
```mermaid
erDiagram
  Match {
    timestamptz date_time
    text team_home
    text team_away
    integer score_home
    integer score_away
  }
  League {
    text name
    text country
    text season
    integer current_round
  }
  Player {
    text name
    text team
    integer goals
    text position
  }
  Fixture {
    integer match_id
    date date
    integer league_id
    text status
  }
```

## Entity Descriptions

### Match
- **date_time**: The date and time when the match is scheduled or occurred.
- **team_home**: The home team participating in the match.
- **team_away**: The away team participating in the match.
- **score_home**: The score of the home team.
- **score_away**: The score of the away team.

### League
- **name**: The name of the league.
- **country**: The country where the league is based.
- **season**: The current season of the league.
- **current_round**: The current round of the league.

### Player
- **name**: The name of the player.
- **team**: The team the player belongs to.
- **goals**: The number of goals scored by the player.
- **position**: The position of the player on the field.

### Fixture
- **match_id**: The identifier for the match.
- **date**: The date the fixture is scheduled.
- **league_id**: The identifier for the league.
- **status**: The current status of the fixture (Scheduled, Ongoing, Completed).