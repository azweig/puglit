# API Documentation

## Endpoints

### Submit a Simulation Attempt
**Method:** `POST`  
**Path:** `/v1/simulations/{simulationId}/attempts`

#### Request
- **Headers**: 
  - `Authorization: Bearer <token>`
- **Body**:
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
      }
    ],
    "client_context": {
      "app_version": "1.0.0",
      "platform": "WEB",
      "started_at": "2026-06-18T10:00:00Z"
    }
  }
  ```

#### Response
- **Body**:
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
        "Lead with lower-commitment extenders before using your normal summon."
      ],
      "optimal_line": {
        "turns_taken": 1,
        "steps": [
          {
            "step": 1,
            "action": "Bait negate with extender"
          }
        ]
      }
    }
  }
  ```

## Authentication
- **Bearer Token**: Required for all API requests.

## Gating
- Users must be authenticated and have access rights to submit attempts. Licensing and subscription checks apply.