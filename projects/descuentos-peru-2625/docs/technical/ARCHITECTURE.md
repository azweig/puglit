# Architecture

## System Overview
Descuentos Perú is a web application designed to scrape and aggregate loyalty programs from various Peruvian providers (e.g., BCP, Interbank, Movistar, Claro, CMR, Bonus) and provide users with location-based discount information. The application leverages user location data and their membership details to display relevant discounts at nearby restaurants and stores.

## Component/Module Map
- **Geo Module**: Handles geolocation services, determining user proximity to discount locations.
- **Growth Module**: Manages user acquisition and engagement strategies, including notifications and offers.

## Technology Stack
- **Next.js 16**: Chosen for its server-side rendering capabilities and ease of building scalable React applications.
- **TypeScript**: Provides type safety and improved developer experience.
- **PostgreSQL via Pooler**: Used for its robust relational database capabilities and connection pooling.
- **Auth JWT**: Ensures secure authentication using JSON Web Tokens.
- **Stripe**: Manages any potential payment processing needs.
- **Resend**: Handles email notifications and communication.
- **Fly.io**: Deploys the application with global edge locations for reduced latency.

## Request Flow
1. **User Authentication**: Users authenticate via JWT, ensuring secure access to the API.
2. **Location and Membership Input**: Users provide their location and membership IDs.
3. **Discount Retrieval**: The system queries the database for discounts matching the user's location and memberships.
4. **Response Delivery**: The application returns a list of applicable discounts to the user.