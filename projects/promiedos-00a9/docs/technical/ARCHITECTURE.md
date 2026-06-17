# Architecture

## System Overview
Promiedos is a real-time platform for tracking Argentine football matches. It provides live updates on matches, fixtures, standings, top goal scorers, and historical results. The data is sourced through web scraping and updated via cron jobs.

## Component/Module Map
- **Next.js 16**: Frontend framework for server-rendered React applications.
- **TypeScript**: Provides static typing for JavaScript, enhancing code quality and maintainability.
- **PostgreSQL via Pooler**: Database for storing match data, standings, and other related information.
- **Auth JWT**: JSON Web Tokens for authentication (though not currently used in the core feature).
- **Stripe**: Integrated for potential future monetization features.
- **Resend**: Used for email notifications and updates.
- **Fly.io**: Platform for deploying the application.

## Stack Justification
- **Next.js** is chosen for its ability to handle server-side rendering and static site generation, which is crucial for SEO and performance.
- **TypeScript** ensures type safety and reduces runtime errors.
- **PostgreSQL** is a robust relational database that supports complex queries and transactions.
- **Fly.io** provides a scalable and easy-to-deploy environment.

## Request Flow
1. **User Request**: A user accesses the `/api/v1/live-matches` endpoint.
2. **API Layer**: The request is handled by the Next.js API routes.
3. **Data Fetching**: The server queries the PostgreSQL database for the latest match data.
4. **Response**: The server constructs a JSON response with matches, tournaments, standings, and goal scorers.
5. **Client Update**: The client receives the data and updates the UI accordingly.