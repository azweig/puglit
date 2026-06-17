# Security

## Threat Model
- **Unauthorized Access**: Ensure only authenticated users can access the API.
- **Data Exposure**: Protect sensitive data such as user locations and membership IDs.
- **Injection Attacks**: Prevent SQL injection by using parameterized queries.

## Authorization Matrix
- **/api/discounts**: Requires Bearer Token; user must have at least one active loyalty program.

## Row-Level Security (RLS)
- Implement RLS in PostgreSQL to ensure users can only access their own data.

## Rate Limiting
- Implement rate limiting to prevent abuse of the API endpoints.

## Data Handling
- **Encryption**: Use HTTPS to encrypt data in transit.
- **Storage**: Store sensitive data securely in the database with appropriate access controls.
