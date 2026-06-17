# Security

## Threat Model
- **Unauthorized Access**: Mitigated by JWT authentication.
- **Data Breaches**: Sensitive data is encrypted and access is restricted.
- **Injection Attacks**: Use of parameterized queries to prevent SQL injection.

## Authorization Matrix
| Resource        | Action  | Role  |
|-----------------|---------|-------|
| Discounts       | View    | User  |
| LoyaltyPrograms | Manage  | User  |

## Row-Level Security (RLS)
- Implemented in PostgreSQL to ensure users can only access their own data.

## Rate Limiting
- Implemented to prevent abuse of the `/api/discounts` endpoint.

## Data Handling
- **Encryption**: All sensitive data is encrypted at rest and in transit.
- **Access Control**: Strict access control policies are enforced.