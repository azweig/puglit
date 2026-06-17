# Security

## Threat Model
- **Unauthorized Access**: Mitigated by requiring JWT authentication for all API requests.
- **Data Breach**: Sensitive data is encrypted, and access is limited to authorized users only.
- **Injection Attacks**: Prevented by using parameterized queries and input validation.

## Authorization Matrix
| Resource       | Action   | Role  |
|----------------|----------|-------|
| Discounts API  | Access   | User  |

## Row-Level Security (RLS)
- Implemented to ensure users can only access discounts relevant to their memberships.

## Rate Limiting
- Requests to the `/api/v1/discounts` endpoint are rate-limited to prevent abuse and ensure fair usage.

## Data Handling
- All personal data is handled in compliance with data protection regulations, ensuring user privacy and security.