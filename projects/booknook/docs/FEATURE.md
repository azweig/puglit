# BookNook Implementation Plan

## Core Feature: Reservation and Notification Engine

### API Routes

1. **POST /reservations**
   - **Description**: Create a new reservation for a book.
   - **Request Body**:
     - `user_id`: UUID of the user making the reservation.
     - `book_id`: UUID of the book to be reserved.
   - **Response**:
     - `reservation_id`: UUID of the created reservation.
     - `status`: Confirmation of reservation status.

2. **GET /notifications**
   - **Description**: Retrieve notifications for a user.
   - **Request Parameters**:
     - `user_id`: UUID of the user.
   - **Response**:
     - List of notifications including book availability alerts.

### Data Flow

1. **Reservation Creation**:
   - User sends a request to `/reservations`.
   - Validate `user_id` and `book_id` against existing records in Postgres.
   - Create a new entry in the `Reservation` table with status 'pending'.

2. **Book Availability Check**:
   - Upon book return or addition, update the `Book` status in the database.
   - Trigger a check for pending reservations.

3. **Notification Dispatch**:
   - If a reserved book becomes available, create a notification in the `Notification` table.
   - Update the reservation status to 'notified'.

### Database Schema

- **Books Table**
  - `book_id`: UUID, Primary Key
  - `title`: String
  - `author`: String
  - `status`: Enum (available, reserved)

- **Reservations Table**
  - `reservation_id`: UUID, Primary Key
  - `user_id`: UUID, Foreign Key
  - `book_id`: UUID, Foreign Key
  - `status`: Enum (pending, notified, completed)

- **Notifications Table**
  - `notification_id`: UUID, Primary Key
  - `user_id`: UUID, Foreign Key
  - `message`: Text
  - `created_at`: Timestamp

- **ReadingHistory Table**
  - `history_id`: UUID, Primary Key
  - `user_id`: UUID, Foreign Key
  - `book_id`: UUID, Foreign Key
  - `borrowed_at`: Timestamp
  - `returned_at`: Timestamp

### Cron Jobs

- **Check Book Availability**
  - **Frequency**: Every 10 minutes
  - **Function**: Scan the `Books` table for status changes and trigger notification dispatch for reservations.

### External Integrations

- **Email/SMS Notification Service**
  - Integrate with a third-party service to send notifications to users when a reserved book becomes available.

### Key Logic and Edge Cases

- **Concurrent Reservations**: Ensure atomic updates to avoid race conditions when multiple users reserve the same book.
- **Reservation Expiry**: Implement a mechanism to expire reservations after a set period if not collected.
- **Notification Retry**: In case of notification failure, implement a retry mechanism to ensure user alert.
- **User Authentication**: Use OAuth2 for secure API access, verifying `user_id` against the auth service.
- **Data Consistency**: Ensure all transactions are ACID compliant to maintain data integrity across operations.