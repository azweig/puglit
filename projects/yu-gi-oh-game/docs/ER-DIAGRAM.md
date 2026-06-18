```mermaid
erDiagram
  Deck {
    text name
    text archetype
    text format
    boolean is_active
  }
  Simulation {
    text title
    text scenario_type
    jsonb starting_state
    text difficulty
  }
  Attempt {
    text result
    integer turns_taken
    text decision_log
    timestamptz completed_at
  }
  Pack {
    text name
    text season
    boolean is_licensed
    date release_date
  }
```