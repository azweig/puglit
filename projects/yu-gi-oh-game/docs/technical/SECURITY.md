# Security

## Threat Model
- **Unauthorized Access**: Mitigated through JWT authentication.
- **Data Breach**: Sensitive data is encrypted and access is restricted.
- **Rate Limiting**: Protects against abuse by limiting the number of attempts per user.

## Authorization Matrix
| Resource   | Action   | Role       | Conditions                        |
|------------|----------|------------|-----------------------------------|
| Simulation | Submit   | User       | Authenticated, licensed access    |
| Attempt    | View     | User/Admin | Authenticated, owns the resource  |

## Row-Level Security (RLS)
- Implemented on the `Attempt` table to ensure users can only access their own attempts.

## Rate Limiting
- Configured to limit the number of active/incomplete attempts per simulation per user.

## Data Handling
- **Encryption**: Sensitive data is encrypted at rest and in transit.
- **Logging**: Access and actions are logged for audit purposes.