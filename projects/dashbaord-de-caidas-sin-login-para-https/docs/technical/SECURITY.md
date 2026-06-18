# Security

## Threat Model
- **Public Access**: The dashboard is publicly accessible, which means it must be protected against abuse, such as excessive requests or data scraping.
- **Data Integrity**: Ensuring the accuracy and integrity of the health check data is crucial.
- **Email Alerts**: Protecting the email alert system from being used for spam.

## Authorization Matrix
- **Public Dashboard**: No authentication required, but rate limiting is applied to prevent abuse.

## Row-Level Security (RLS)
- Not applicable as the dashboard is publicly accessible and does not require user-specific data segregation.

## Rate Limiting
- **60 requests/minute per IP**: Implemented to prevent abuse and ensure fair usage of the public endpoint.

## Data Handling
- **Health Check Data**: Stored securely in PostgreSQL with regular backups.
- **Alert Emails**: Sent using Resend, ensuring that email addresses are not exposed or misused.