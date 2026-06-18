# Architecture

## System Overview
The dashboard is a public, no-login interface designed to monitor the availability of the URL `https://addi.meetgravity.io/sign-in`. It detects downtimes and sends email alerts when the URL is unresponsive or returns an HTTP error. The dashboard displays the current status and basic metrics.

## Component/Module Map
- **Engine**: Responsible for scheduling and executing health checks on the monitored endpoint.
- **ContentBlog**: Manages static content and documentation related to the dashboard.
- **EmailLifecycle**: Handles the lifecycle of alert emails, including sending notifications when downtimes are detected or resolved.

## Technology Stack
- **Next.js 16**: Used for server-side rendering and building the frontend of the dashboard.
- **TypeScript**: Provides static typing for JavaScript, enhancing code quality and maintainability.
- **PostgreSQL via Pooler**: Database for storing monitored endpoints, health checks, and alert events.
- **JWT**: Though not used for this public dashboard, JWT is typically used for authentication in other parts of the stack.
- **Stripe**: Not directly used in this dashboard, but part of the broader stack for handling payments.
- **Resend**: Service used to send email alerts.
- **Fly.io**: Deployment platform for hosting the application.

## Request Flow
1. **Health Check Execution**: The engine periodically triggers health checks based on the configured interval for the monitored endpoint.
2. **Data Storage**: Results of health checks are stored in PostgreSQL.
3. **Alert Generation**: If a downtime is detected, an alert event is created and an email is sent via Resend.
4. **Public Dashboard Access**: Users access the dashboard via the `/api/public/status` endpoint to view the current status and metrics.

The flow ensures that the dashboard is updated in near real-time with the latest status of the monitored endpoint.