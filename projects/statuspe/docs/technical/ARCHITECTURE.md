# Architecture

## System Overview
StatusPe is a public status page service that monitors HTTPS endpoints and displays their current status, uptime history, and incidents. It is designed to be publicly accessible without requiring user authentication, similar to status.claude.com.

## Component/Module Map
- **Engine**: Core logic for monitoring endpoints and managing status checks and incidents.

## Technology Stack
- **Next.js 16**: Chosen for its server-side rendering capabilities and ease of building static and dynamic pages.
- **TypeScript**: Provides type safety and improved developer experience.
- **PostgreSQL via Pooler**: Used for its robustness and support for complex queries, with connection pooling for efficiency.
- **Auth JWT**: Although no auth is required for public pages, JWT is used internally for secure API interactions.
- **Stripe**: Integrated for potential future monetization features.
- **Resend**: Used for sending notifications about incidents or status changes.
- **Fly.io**: Chosen for its simplicity in deploying and scaling applications globally.

## Request Flow
1. **Client Request**: A client requests the status page via `GET /api/v1/status-pages/:slug`.
2. **Routing**: The request is routed based on the slug or custom domain.
3. **Data Fetching**: The server fetches data from PostgreSQL, including endpoint statuses, incidents, and historical checks.
4. **Response Generation**: The server aggregates the data into a single response object.
5. **Response Delivery**: The response is sent back to the client, rendering the status page.