# Data Model

## Entity-Relationship Diagram
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
  Deck ||--o{ Attempt : ""
  Simulation ||--o{ Attempt : ""
  Pack ||--o{ Simulation : ""
```

## Entity Descriptions
- **Deck**: Represents a collection of cards used in simulations, characterized by its name, archetype, format, and active status.
- **Simulation**: Defines a duel scenario with a title, scenario type, starting state, and difficulty level.
- **Attempt**: Captures a user's attempt at a simulation, including the result, turns taken, decision log, and completion timestamp.
- **Pack**: Represents a set of cards available in a specific season, with licensing information and release date.