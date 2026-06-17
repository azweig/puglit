# Architecture

## System Overview
Promiedos is a live Argentine football tracking application that provides real-time updates on matches, fixtures, standings, top scorers, and historical results. The system is designed to scrape data and update it periodically using cron jobs.

## Component/Module Map
- **Frontend**: Built with Next.js 16, providing a responsive UI for users to view live matches, standings, and more.
- **Backend**: Implemented in TypeScript, handling API requests, data processing, and business logic.
- **Database**: PostgreSQL, accessed via a connection pooler for efficient resource management.
- **Authentication**: JWT-based authentication to secure API endpoints.
- **Payments**: Stripe integration for any premium features or donations.
- **Email**: Resend for sending notifications or updates to users.
- **Hosting**: Deployed on Fly.io for backend services and Vercel for frontend.

## The Stack and Why
- **Next.js 16**: Chosen for its server-side rendering capabilities and seamless integration with React, providing a fast and SEO-friendly frontend.
- **TypeScript**: Ensures type safety and reduces runtime errors, improving code maintainability.
- **PostgreSQL**: A robust relational database that supports complex queries and transactions, ideal for handling structured sports data.
- **JWT**: Provides a secure and stateless authentication mechanism.
- **Stripe**: A reliable payment processor that handles transactions securely.
- **Resend**: Simplifies email sending with a focus on deliverability.
- **Fly.io**: Offers global deployment with low latency, suitable for real-time applications.

## Request Flow
1. **User Request**: A user accesses the application to view live matches.
2. **Frontend**: The Next.js frontend sends a request to the backend API.
3. **Backend**: The TypeScript backend processes the request, querying the PostgreSQL database.
4. **Database**: Data is retrieved from PostgreSQL using efficient queries.
5. **Response**: The backend sends the data back to the frontend.
6. **Display**: The frontend renders the data for the user.

This architecture ensures a seamless and responsive user experience while maintaining data integrity and security.