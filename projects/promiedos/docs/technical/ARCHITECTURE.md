# Architecture

## System Overview
Promiedos is a live football data platform focused on Argentine football. It provides real-time updates on matches, fixtures, standings, top scorers, and historical results. The data is scraped and updated via cron jobs.

## Component/Module Map
- **Frontend**: Built with Next.js 16, providing server-side rendering and static site generation.
- **Backend**: Node.js with TypeScript for type safety and scalability.
- **Database**: PostgreSQL, accessed via a connection pooler for efficient resource management.
- **Authentication**: JWT for secure, stateless authentication.
- **Payments**: Stripe for handling any potential monetization features.
- **Email Services**: Resend for transactional emails.
- **Hosting**: Fly.io for backend deployment, Vercel for frontend.

## The Stack and Why
- **Next.js 16**: Chosen for its robust support for SSR and SSG, crucial for SEO and performance.
- **TypeScript**: Provides type safety, reducing runtime errors and improving code maintainability.
- **PostgreSQL**: A reliable and powerful relational database, well-suited for complex queries and data integrity.
- **JWT**: Offers a secure, scalable way to handle authentication without server-side sessions.
- **Stripe**: Industry-standard for payment processing, ensuring security and compliance.
- **Resend**: Simplifies email sending with a developer-friendly API.
- **Fly.io**: Provides a global, performant hosting solution with easy scaling.

## How Requests Flow
1. **User Request**: A user accesses the site, triggering a request to the Next.js server.
2. **Data Fetching**: The server queries the PostgreSQL database for the latest data.
3. **Response Generation**: The server renders the page with the latest data.
4. **Client Interaction**: Users interact with the page, triggering additional requests as needed.
5. **Background Jobs**: Cron jobs scrape and update data periodically, ensuring freshness.