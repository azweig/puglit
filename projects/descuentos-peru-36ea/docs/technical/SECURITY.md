# Security

## Threat Model
- **Data Breaches**: Unauthorized access to user data.
- **Authentication Bypass**: Exploiting vulnerabilities to bypass authentication.
- **Denial of Service (DoS)**: Overloading the system to make it unavailable.

## Authorization Matrix
- **User**: Can access their own loyalty programs and discounts.
- **Admin**: Can manage all user data and system configurations.

## Row-Level Security (RLS)
- Implement RLS in PostgreSQL to ensure users can only access their own data.

## Rate Limiting
- Implement rate limiting on API endpoints to prevent abuse and DoS attacks.

## Data Handling
- Encrypt sensitive data at rest and in transit.
- Regularly audit access logs and user permissions.