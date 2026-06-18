# NeonJump API Documentation

## Endpoints

### `POST /v1/runs`
Submits a completed run for scoring, ranking, and unlock evaluation.

#### Authentication
- **Required**: `Authorization: Bearer <player_token>`

#### Request Body
```json
{
  "player_name": "Luna",
  "run": {
    "score": 1840,
    "duration_seconds": 142,
    "coins_collected": 37,
    "ended_at": "2026-06-18T14:22:00Z"
  }
}
```

#### Response Body
```json
{
  "accepted": true,
  "run": {
    "score": 1840,
    "duration_seconds": 142,
    "coins_collected": 37,
    "ended_at": "2026-06-18T14:22:00Z"
  },
  "leaderboard": {
    "player_rank": 12,
    "top": [
      {
        "player_name": "Astra",
        "score": 2500,
        "rank": 1,
        "achieved_at": "2026-06-18T10:00:00Z"
      }
    ],
    "around_player": [
      {
        "player_name": "Nova",
        "score": 1860,
        "rank": 11,
        "achieved_at": "2026-06-18T13:59:00Z"
      },
      {
        "player_name": "Luna",
        "score": 1840,
        "rank": 12,
        "achieved_at": "2026-06-18T14:22:00Z"
      }
    ]
  },
  "new_unlocks": [
    {
      "unlock_type": "skin",
      "title": "Golden Hopper",
      "is_equipped": false,
      "unlocked_at": "2026-06-18T14:22:01Z"
    }
  ]
}
```

#### Gating / Rules
- Only **completed runs** may be submitted.
- One token maps to one player identity.
- `score`, `duration_seconds`, and `coins_collected` must be non-negative integers.
- Server validates anti-cheat / plausibility before `accepted = true`.
- Leaderboard is **global high-score descending**.
- Unlocks are granted based on run outcomes/progression at submit time.
- If rejected for validation/cheat reasons, return `accepted: false` and no leaderboard rank update.