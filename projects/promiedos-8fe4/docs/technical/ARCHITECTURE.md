# Architecture

## System Overview
Promiedos is a real-time platform for tracking Argentine football matches, providing live updates, fixtures, standings, top scorers, and historical results. The system scrapes data and updates it via cron jobs.

## Component/Module Map
- **Next.js 16**: Frontend framework for server-side rendering and static site generation.
- **TypeScript**: Provides type safety and tooling for JavaScript.
- **PostgreSQL via Pooler**: Database for storing match, tournament, standings, and scorer data.
- **Auth JWT**: JSON Web Tokens for secure API authentication.
- **Stripe**: Payment processing for premium features.
- **Resend**: Email service for notifications and alerts.
- **Fly.io**: Deployment platform for hosting the application.

## The Stack and Why
- **Next.js**: Chosen for its ability to handle both server-side and client-side rendering efficiently, crucial for real-time updates.
- **TypeScript**: Ensures code reliability and maintainability.
- **PostgreSQL**: Robust relational database suitable for complex queries and data integrity.
- **JWT**: Secure and stateless authentication mechanism.
- **Stripe**: Trusted payment gateway for handling transactions.
- **Resend**: Reliable email service for user communications.
- **Fly.io**: Provides scalable and global deployment options.

## How Requests Flow
1. **User Request**: A user requests live match data via the frontend.
2. **API Gateway**: The request hits the API gateway, which checks for a valid JWT.
3. **Data Fetching**: If authenticated, the request is processed, and data is fetched from PostgreSQL.
4. **Response**: The data is sent back to the client, rendered by Next.js.
5. **Updates**: Cron jobs periodically update the database with new data scraped from external sources.