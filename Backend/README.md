# NestPoint – Rental Management System

Backend system for property rental management built with Spring Boot and PostgreSQL.

## Features
- REST API implementation
- PostgreSQL Database
- Multi-criteria search functionality with pagination
- Comprehensive domain model with bidirectional relationships
- API documentation with Swagger
- Admin views with Spring MVC

## Overview
NestPoint provides a robust backend for managing rental properties, owners, tenants, and rental agreements. The system supports advanced searching and filtering capabilities to efficiently find available properties based on multiple criteria.

## TO RUN REDIS FOR SHARED WEBSOCKET CONNECTIONS EXECUTE:
docker run --name nestpoint-redis -p 6379:6379 -d redis