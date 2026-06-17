# Security

## Threat Model
- **Data Breaches**: Protect user data and match information from unauthorized access.
- **DDoS Attacks**: Mitigate potential denial-of-service attacks that could disrupt service.
- **Data Integrity**: Ensure the accuracy and consistency of data over its lifecycle.

## Authorization Matrix
- **Public Endpoints**: `/api/live-matches` - No authentication required, rate-limited.

## Row-Level Security (RLS)
- Not applicable as data is publicly accessible and does not contain sensitive user-specific information.

## Rate Limiting
- Implemented at 100 requests per minute per IP to prevent abuse and ensure fair usage.

## Data Handling
- **Encryption**: Data in transit is encrypted using HTTPS.
- **Storage**: Sensitive data is not stored; match data is considered public.