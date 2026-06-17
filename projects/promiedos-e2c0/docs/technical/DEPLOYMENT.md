# Deployment

## Environments
- **Development**: Local environment for development and testing.
- **Staging**: Pre-production environment for final testing.
- **Production**: Live environment hosted on Fly.io.

## Migrations
- Use `knex` for database migrations to ensure schema consistency across environments.

## Fly/Vercel Deployment
- **Fly.io**: Deploy backend services and database.
- **Vercel**: Deploy frontend Next.js application.

## Continuous Integration (CI)
- **GitHub Actions**: Automate testing and deployment pipelines.

## Observability
- **Logging**: Use centralized logging for monitoring application health.
- **Monitoring**: Implement application performance monitoring (APM) to track system performance and errors.
- **Alerts**: Set up alerts for critical issues to ensure timely response.