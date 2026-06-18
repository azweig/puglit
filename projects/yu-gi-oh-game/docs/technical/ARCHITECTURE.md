# Architecture

## System Overview
The Yu-Gi-Oh! Game is a learning and training application designed for returning Yu-Gi-Oh! players. It focuses on guided mini-duel simulations that teach real duel decisions, particularly breaking boards and finding lethal lines. The system is built on the Puglit/TodoAstros stack, leveraging modern web technologies to deliver a seamless user experience.

## Component/Module Map
- **Engine**: Core logic for duel simulations, including decision evaluation and scoring.
- **Growth**: Manages user progression, achievements, and personalized recommendations.
- **Profiling**: Handles user profiles, preferences, and history.
- **ContentBlog**: Provides articles, guides, and updates related to Yu-Gi-Oh! strategies and news.

## Technology Stack
- **Next.js 16**: Provides server-side rendering and static site generation for optimal performance.
- **TypeScript**: Ensures type safety and improved developer experience.
- **PostgreSQL via Pooler**: Manages database connections efficiently, ensuring scalability and reliability.
- **Auth JWT**: Secures API endpoints with JSON Web Tokens for authentication.
- **Stripe**: Handles payments and subscriptions for premium content.
- **Resend**: Manages email notifications and communication.
- **Fly.io**: Deploys the application with global edge locations for reduced latency.

## Request Flow
1. **User Authentication**: Users authenticate via JWT tokens.
2. **Simulation Initiation**: Users select a simulation scenario.
3. **Decision Making**: Users make decisions step-by-step in the simulation.
4. **Submission**: Users submit their attempt, which is evaluated and stored.
5. **Feedback**: Users receive feedback on their performance, including teaching points and optimal lines.