# Architecture

## System Overview
Promiedos is a web application that provides live updates on Argentine football matches, including fixtures, standings, top scorers, and historical results. The system scrapes data from various sources and updates it using cron jobs.

## Component/Module Map
- **Next.js 16**: Frontend framework for server-side rendering and static site generation.
- **TypeScript**: Provides type safety and improved developer experience.
- **PostgreSQL via Pooler**: Database for storing match data, standings, tournaments, and goal scorers.
- **Auth JWT**: JSON Web Tokens for authentication.
- **Stripe**: Payment processing for potential premium features.
- **Resend**: Email service for notifications and alerts.
- **Fly.io**: Hosting and deployment platform.

## The Stack and Why
- **Next.js** is chosen for its ability to handle both static and dynamic content efficiently, which is crucial for live sports updates.
- **TypeScript** ensures type safety across the application, reducing runtime errors.
- **PostgreSQL** is used for its robustness and ability to handle complex queries, which is essential for aggregating sports data.
- **JWT** is used for secure and stateless authentication.
- **Stripe** is integrated for handling any future monetization strategies.
- **Resend** is used for reliable email delivery.
- **Fly.io** is selected for its ease of deployment and scalability.

## How Requests Flow
1. **User Request**: A user requests live match data via the frontend.
2. **Authentication**: The request is authenticated using JWT.
3. **Data Fetching**: The server queries the PostgreSQL database for the requested data.
4. **Response**: The server sends the data back to the client in the form of JSON.
5. **Rendering**: Next.js renders the data on the frontend, updating the UI in real-time.