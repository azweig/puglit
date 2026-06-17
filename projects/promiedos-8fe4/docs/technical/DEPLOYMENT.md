# Deployment

## Environments
- **Development**: Local environment with mock data and debugging enabled.
- **Staging**: Pre-production environment for testing new features.
- **Production**: Live environment with real data and active users.

## Migrations
- Use `knex` or similar tool for database migrations.
- Ensure migrations are applied before deploying new code.

## Fly/Vercel Deployment
- **Fly.io**: Deploy backend services and database.
- **Vercel**: Deploy frontend Next.js application.

## Continuous Integration (CI)
- Use GitHub Actions for automated testing and deployment.
- Ensure tests pass before merging to main branch.

## Observability
- Implement logging and monitoring using tools like Datadog or New Relic.
- Set up alerts for critical failures or performance issues.