# Build report — Truke

## Findings (control plane)

### BLOCKING (resolved before ship)
- The response for unauthorized access should return a NextResponse object with a status code, not just the status code 401. It should be `return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });`.
- The contract specifies that the user cannot match with their own item, but the current implementation checks this twice. The first check is redundant and should be removed.
- The SQL query for checking item availability and ownership should not include `owner_id != $2` since it is already ensured by the previous check that the user is not matching with their own item.

### ADVISORY (deferred to backlog)
- The error message for unauthorized access should be more descriptive, such as 'Unauthorized access' instead of just 'Unauthorized'.
