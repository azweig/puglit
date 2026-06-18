# Deployment

## Environments
- **Development**: Local environment for testing and development.
- **Production**: Hosted on Fly.io for public access.

## Migrations
- Database migrations are managed using a migration tool compatible with PostgreSQL.

## Deployment Process
- **Fly.io**: Used for deploying the production environment. The deployment process involves building the application and pushing it to Fly.io.
- **Vercel**: Not directly used in this project, but part of the broader stack for other applications.

## Continuous Integration (CI)
- Automated tests are run on each commit to ensure code quality and functionality.

## Observability
- Monitoring and logging are set up to track application performance and detect issues in real-time.
- Alerts are configured to notify the team of any critical issues detected in production.