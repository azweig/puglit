# Build report — Notely

## Findings (control plane)

### BLOCKING (resolved before ship)
- The `CreateNoteRequest` type specifies that `reminder` should be of type `Omit<Reminder, 'id' | 'is_completed'>`, but the code does not enforce this structure. The `reminder` object should not include `id` or `is_completed` properties when being passed in the request.
- The `CreateNoteResponse` type specifies that `tags` should be an array of `Tag` objects, but the code does not ensure that the `tags` array in the response matches the `Tag` type exactly. The `Tag` type includes `id`, `name`, and `color`, which should be validated.

### ADVISORY (deferred to backlog)
- The code does not validate the format of `reminder_time` to ensure it is in ISO 8601 format as required by the `Reminder` type.
- The code does not validate the `color` property of tags to ensure it is a valid hex color code as required by the `Tag` type.
