# Build report — Linkly

## Findings (control plane)

### BLOCKING (resolved before ship)
- The rate limiting logic does not reset the count after a certain period, which could lead to permanent blocking after 100 requests.
- The `rateLimitKey` variable is defined but never used, which is unnecessary and could lead to confusion.

### ADVISORY (deferred to backlog)
- The URL shortening logic uses a simple random string which might lead to collisions. Consider using a more robust method for generating unique shortened URLs.
- The `original_url` validation using `globalThis.URL` is correct, but consider adding more comprehensive validation to ensure the URL is not only syntactically correct but also valid in context (e.g., not a local or private IP).
