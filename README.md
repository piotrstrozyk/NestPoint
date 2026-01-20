# NestPoint: Platform for tourism and short term rentals

Backend system for managing property rentals built using Spring Boot, PostgreSQL, and Redis.

## Running the Project

To run the NestPoint system, follow these steps:

1. Docker is required
2. Clone the project repository or extract the ZIP archive
3. Navigate to the project directory and run:

```bash
docker-compose up
```

This command will start:

* PostgreSQL database on port 5432
* Redis server on port 6379
* Backend application on port 8080

## API Access

* The server is available at: [http://localhost:8080](http://localhost:8080)
* Swagger documentation: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)

## Creating an Administrator

To create an administrator account, send a POST request to the `/register-admin` endpoint with the following data format:

```json
{
  "username": "admin",
  "email": "admin@example.com",
  "password": "securepassword",
  "firstName": "Admin",
  "lastName": "User",
  "phone": "123-456-7891",
  "secretKey": "super_secure_admin_key_2025"
}
```

## User Roles

The system supports three user roles:

* **OWNER** – property owners offering rentals
* **TENANT** – tenants searching for properties
* **ADMIN** – system administrators with full permissions

## WebSocket Functionality

The system uses WebSocket for real-time communication, including:

* Property auction bidding
* User-to-user chats

Redis is used to manage WebSocket connections.

## Swagger

Swagger is available at [http://localhost:8080/swagger-ui/index.html#/](http://localhost:8080/swagger-ui/index.html#/).
You must log in with an account registered via an endpoint in order to test endpoints with role-based restrictions (Swagger will prompt you to do so).

## Running Tests

To run unit and integration tests, use the Maven command:

```bash
mvn test
```

or

```bash
mvn clean install
```

To generate a test coverage report (using JaCoCo):

```bash
mvn verify
```

The coverage report will be available at `target/site/jacoco/index.html`.

## Scheduled Tasks

The application uses scheduled tasks to automatically manage data:

### 1. Rental Management

* Updating rental statuses (daily at midnight) – changing PENDING → ACTIVE and ACTIVE → COMPLETED
* Checking payment deadlines (every 5 minutes) – applying penalties for late payments
* Blocking users with unpaid penalties (every hour)

### 2. Auction Management

* Processing auction statuses (every 30 seconds) – activating and ending auctions
* Cleaning up outdated auction participant data (every hour)

These tasks run automatically in the background and require no additional configuration.

### Customizing Scheduled Tasks

All scheduled tasks are configured using the `@Scheduled` annotation in service classes:

#### 1. **RentalService.java** contains:

* `updateRentalStatuses()` – updates rental statuses
  (`@Scheduled(cron = "0 0 0 * * ?")`) – daily at midnight
* `checkPaymentDeadlines()` – checks payment deadlines
  (`@Scheduled(fixedRate = 300000)`) – every 5 minutes (300,000 ms)
* `blockUsersWithUnpaidFees()` – blocks users with unpaid penalties
  (`@Scheduled(fixedRate = 3600000)`) – every hour (3,600,000 ms)

#### 2. **AuctionService.java** contains:

* `processAuctionStatuses()` – processes auction statuses
  (`@Scheduled(fixedRate = 30000)`) – every 30 seconds (30,000 ms)
* `cleanupOldAuctionData()` – cleans up auction participant data
  (`@Scheduled(fixedRate = 3600000)`) – every hour (3,600,000 ms)

To change the execution frequency of these tasks, modify the parameters of the `@Scheduled` annotation.
Values for the `fixedRate` parameter are specified in milliseconds.
