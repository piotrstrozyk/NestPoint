# NestPoint: Platform for Tourism and Short-Term Rentals

Frontend system for managing property rentals built using **Next.js**.

## Running the Project

To run the NestPoint frontend, follow these steps:

1. Docker is required
2. Clone the project repository or extract the ZIP archive
3. Navigate to the project directory and run:

```bash
docker compose -f docker-compose.prod.yml up --build
```

This command will build the Frontend service and expose it on port **3000**.

Alternatively, you can run the development environment using the command below. Note, however, that it will not perform as smoothly as the production version.

```bash
docker compose -f docker-compose.dev.yml up --build
```

## Running Tests

To run Vitest tests, navigate to the project directory and run:

```bash
pnpm run test
```

To run Vitest tests and generate code coverage data, run:

```bash
pnpm run test:coverage
```

## Client Application Access

* The application client is available at: [http://localhost:3000](http://localhost:3000)

