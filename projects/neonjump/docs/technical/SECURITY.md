# NeonJump Security

## Threat Model
- **Data Integrity**: Ensure that all submitted scores are legitimate and not tampered with.
- **Authentication**: Secure player identities using JWT.
- **Authorization**: Ensure that only authorized players can submit runs and access their data.
- **Rate Limiting**: Prevent abuse by limiting the number of requests per player.

## Authorization Matrix
| Endpoint     | Method | Role  | Description                  |
|--------------|--------|-------|------------------------------|
| `/v1/runs`   | POST   | Player| Submit a completed run      |

## Row-Level Security (RLS)
- Implement RLS on the PostgreSQL database to ensure players can only access their own data.

## Rate Limiting
- Implement rate limiting at the API gateway to prevent abuse and ensure fair usage.

## Data Handling
- Encrypt sensitive data at rest and in transit.
- Regularly audit access logs and monitor for suspicious activity.