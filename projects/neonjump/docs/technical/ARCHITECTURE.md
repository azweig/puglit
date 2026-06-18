# NeonJump Architecture

## System Overview
NeonJump is an arcade-style platform game where players jump between ascending platforms, avoid enemies, and collect coins. The game features increasing difficulty and a global leaderboard to track high scores. Players can unlock new rewards based on their performance.

## Component/Module Map
- **Next.js 16**: Utilized for the frontend, providing server-side rendering and static site generation.
- **TypeScript**: Ensures type safety across the codebase.
- **PostgreSQL via Pooler**: Manages database connections efficiently.
- **Auth JWT**: Handles player authentication using JSON Web Tokens.
- **Stripe**: Integrated for potential in-game purchases or premium features.
- **Resend**: Used for email notifications or confirmations.
- **Fly.io**: Deployment platform for the backend services.

## Technology Stack
- **Next.js 16**: Chosen for its robust ecosystem and ability to handle both frontend and backend logic seamlessly.
- **TypeScript**: Provides static typing, reducing runtime errors and improving code maintainability.
- **PostgreSQL**: A reliable relational database system, ideal for handling structured data like player scores and unlocks.
- **JWT Authentication**: Ensures secure and stateless authentication.
- **Stripe**: Facilitates secure payment processing.
- **Resend**: Simplifies email sending and management.
- **Fly.io**: Offers scalable and efficient deployment for cloud applications.

## Request Flow
1. **Player Authentication**: Players authenticate using JWT tokens.
2. **Game Play**: Players engage in the game, aiming for high scores.
3. **Run Submission**: Completed runs are submitted via the `/v1/runs` endpoint.
4. **Leaderboard Update**: The server processes the run, updates the leaderboard, and evaluates potential unlocks.
5. **Response**: The client receives a response with the updated leaderboard and any new unlocks.