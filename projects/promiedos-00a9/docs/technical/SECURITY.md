# Security

## Threat Model
- **Data Integrity**: Ensure that the scraped data is accurate and not tampered with.
- **Denial of Service**: Protect against excessive requests that could overwhelm the system.
- **Data Privacy**: Although no sensitive user data is handled, ensure that any future user data is protected.

## Authorization Matrix
- Currently, no authorization is required for accessing the live match data.

## Row-Level Security (RLS)
- Not implemented as the current data model does not require user-specific data access.

## Rate Limiting
- Implement rate limiting at the API gateway to prevent abuse and ensure fair usage.

## Data Handling
- Ensure all data is validated and sanitized before being processed or stored.
- Regularly update and patch dependencies to mitigate vulnerabilities.