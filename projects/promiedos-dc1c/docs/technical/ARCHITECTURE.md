# Architecture

## System Overview
Promiedos is a real-time football tracking application focused on Argentine football. It provides live updates on matches, fixtures, league standings, top scorers, and historical results. The data is scraped and updated via cron jobs.

## Component/Module Map
- **Frontend**: Built with Next.js 16, providing a seamless user interface for live updates and historical data.
- **Backend**: Implemented in TypeScript, handling data processing and API requests.
- **Database**: PostgreSQL with connection pooling for efficient data handling.
- **Authentication**: JWT-based, ensuring secure access to user-specific data.
- **Payment Processing**: Integrated with Stripe for any premium features.
- **Email Services**: Utilizes Resend for email notifications.
- **Deployment**: Hosted on Fly.io for backend services, with Vercel for frontend.

## The Stack and Why
- **Next.js 16**: Chosen for its server-side rendering capabilities, improving performance and SEO.
- **TypeScript**: Provides type safety, reducing runtime errors and improving code maintainability.
- **PostgreSQL**: A robust relational database system, ideal for handling complex queries and relationships.
- **JWT**: Secure token-based authentication, suitable for stateless session management.
- **Stripe**: A reliable and secure payment processing service.
- **Resend**: Simplifies email delivery with a focus on deliverability.
- **Fly.io**: Offers a global application platform, reducing latency and improving performance.

## How Requests Flow
1. **User Request**: A user requests live match data through the frontend.
2. **API Call**: The frontend makes a call to the `/api/live-matches` endpoint.
3. **Data Retrieval**: The backend queries the PostgreSQL database for the requested data.
4. **Response**: The data is processed and returned to the frontend.
5. **Display**: The frontend updates the UI with the latest match information.