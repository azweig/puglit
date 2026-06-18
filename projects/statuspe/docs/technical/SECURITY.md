# Security

## Threat Model
- **Public Exposure**: The application is designed to be publicly accessible, which increases the risk of information exposure.
- **Data Integrity**: Ensuring that only valid and authorized data is displayed on the status page.
- **Denial of Service (DoS)**: Protecting against excessive requests that could overwhelm the system.

## Authorization Matrix
- **Public Access**: No authentication required for viewing public status pages.
- **Admin Access**: Admins can report incidents and manage endpoints via secure internal interfaces.

## Row-Level Security (RLS)
- Not applicable as the data is read-only for public access.

## Rate Limiting
- Implement rate limiting on public API endpoints to mitigate DoS attacks.

## Data Handling
- Ensure all data is validated and sanitized before processing.
- Use HTTPS for all data transmission to protect against eavesdropping.