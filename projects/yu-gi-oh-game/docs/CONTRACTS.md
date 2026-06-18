# Contract — Core Feature: Guided Mini-Duel Simulation Attempt

## Core Feature
Start and submit a **guided mini-duel simulation attempt** where a returning Yu-Gi-Oh! player is presented a curated duel state and makes decision-by-decision plays to break a board or find lethal.

---

## TypeScript Types

```ts
type ID = string;
type ISODate = string;
type ISODateTime = string;

type Format = "TCG" | "OCG" | "MASTER_DUEL" | "GOAT" | "EDISON";
type ScenarioType = "BREAK_BOARD" | "FIND_LETHAL" | "PLAY_THROUGH_INTERRUPTIONS";
type Difficulty = "EASY" | "MEDIUM" | "HARD";
type AttemptResult = "SUCCESS" | "FAILURE" | "ABANDONED";

export interface Deck {
  id: ID;
  name: string;
  archetype: string;
  format: Format;
  is_active: boolean;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface Simulation {
  id: ID;
  title: string;
  scenario_type: ScenarioType;
  starting_state: Record<string, unknown>;
  difficulty: Difficulty;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface AttemptDecision {
  step: number;
  action: string;
  card_ref?: string;
  target_ref?: string;
  note?: string;
  correct?: boolean;
}

export interface Attempt {
  id: ID;
  simulation_id: ID;
  deck_id?: ID;
  result: AttemptResult;
  turns_taken: number;
  decision_log: AttemptDecision[];
  completed_at: ISODateTime;
  created_at: ISODateTime;
}

export interface Pack {
  id: ID;
  name: string;
  season: string;
  is_licensed: boolean;
  release_date: ISODate;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}
```

---

## Single Most Important API Endpoint

### Submit a simulation attempt
Creates and grades a player’s guided mini-duel run.

**Method:** `POST`  
**Path:** `/v1/simulations/{simulationId}/attempts`

---

## Auth
**Required:** Bearer token  
```http
Authorization: Bearer <token>
```

---

## Gating
User may submit only if:

- authenticated
- simulation exists and is published/available
- if `deck_id` is provided, it belongs to the user
- premium/licensed gating passes for simulation content tied to licensed packs
- optional anti-abuse limit: max N active/incomplete attempts per simulation per user

Errors:
- `401 Unauthorized`
- `403 Forbidden` — gated by subscription/licensing/access
- `404 Not Found` — simulation or deck not found
- `409 Conflict` — attempt cannot be submitted due to state/rate gating

---

## Request

```ts
export interface SubmitSimulationAttemptRequest {
  deck_id?: ID;
  turns_taken: number;
  decision_log: AttemptDecision[];
  client_context?: {
    app_version?: string;
    platform?: "WEB" | "IOS" | "ANDROID";
    started_at?: ISODateTime;
  };
}
```

### Example
```json
{
  "deck_id": "deck_123",
  "turns_taken": 1,
  "decision_log": [
    {
      "step": 1,
      "action": "Normal Summon Aleister the Invoker",
      "card_ref": "card_aleister",
      "correct": true
    },
    {
      "step": 2,
      "action": "Activate Invocation",
      "card_ref": "card_invocation",
      "target_ref": "monster_mechaba"
    }
  ],
  "client_context": {
    "app_version": "1.0.0",
    "platform": "WEB",
    "started_at": "2026-06-18T10:00:00Z"
  }
}
```

---

## Response

```ts
export interface SubmitSimulationAttemptResponse {
  attempt: Attempt;
  evaluation: {
    passed: boolean;
    score: number; // 0-100
    summary: string;
    mistakes: Array<{
      step: number;
      reason: string;
    }>;
    teaching_points: string[];
    optimal_line?: {
      turns_taken: number;
      steps: AttemptDecision[];
    };
  };
}
```

### Example
```json
{
  "attempt": {
    "id": "att_456",
    "simulation_id": "sim_789",
    "deck_id": "deck_123",
    "result": "SUCCESS",
    "turns_taken": 1,
    "decision_log": [
      {
        "step": 1,
        "action": "Normal Summon Aleister the Invoker",
        "card_ref": "card_aleister",
        "correct": true
      },
      {
        "step": 2,
        "action": "Activate Invocation",
        "card_ref": "card_invocation",
        "target_ref": "monster_mechaba",
        "correct": true
      }
    ],
    "completed_at": "2026-06-18T10:03:00Z",
    "created_at": "2026-06-18T10:00:00Z"
  },
  "evaluation": {
    "passed": true,
    "score": 92,
    "summary": "You found lethal through one interruption with a near-optimal line.",
    "mistakes": [],
    "teaching_points": [
      "Lead with lower-commitment extenders before using your normal summon.",
      "Play around common negates by forcing interaction early."
    ],
    "optimal_line": {
      "turns_taken": 1,
      "steps": [
        {
          "step": 1,
          "action": "Bait negate with extender"
        },
        {
          "step": 2,
          "action": "Commit to fusion line for lethal"
        }
      ]
    }
  }
}
```

---

## Notes
- This endpoint is the core loop: **player submits a duel line, system stores the Attempt, grades decision quality, and returns coaching feedback**.
- `starting_state` remains owned by the `Simulation`; client does not send it when submitting.