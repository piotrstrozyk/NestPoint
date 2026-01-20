# ── Stage 1: build with Maven ─────────────────────────────────────────────
FROM maven:3.9.4-eclipse-temurin-17-alpine AS builder

WORKDIR /app

# 1) Copy only pom.xml first, to leverage Docker cache for dependencies
COPY pom.xml .

# 2) Pull down all dependencies (no source copied yet)
RUN mvn dependency:go-offline -B

# 3) Copy source and package
COPY src ./src
RUN mvn package -DskipTests -B

# ── Stage 2: runtime ──────────────────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

RUN apk add --no-cache tzdata \
    && cp /usr/share/zoneinfo/Europe/Warsaw /etc/localtime \
    && echo "Europe/Warsaw" > /etc/timezone \
    && apk del tzdata

# 4) Copy built jar from builder stage
COPY --from=builder /app/target/*.jar app.jar

# 5) Expose and run
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
