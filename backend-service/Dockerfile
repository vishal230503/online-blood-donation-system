# syntax=docker/dockerfile:1
# Build context MUST be the repository root:  docker build -f backend-service/Dockerfile .

# ---------- Stage 1: build ----------
FROM maven:3.9.6-eclipse-temurin-11 AS build
WORKDIR /workspace

# Copy POMs first so dependency resolution is cached between builds
COPY pom.xml .
COPY common-lib/pom.xml common-lib/pom.xml
COPY address-service/pom.xml address-service/pom.xml
COPY backend-service/pom.xml backend-service/pom.xml
RUN --mount=type=cache,target=/root/.m2 \
    mvn -B -q -pl backend-service -am dependency:go-offline || true

COPY common-lib/src common-lib/src
COPY backend-service/src backend-service/src
RUN --mount=type=cache,target=/root/.m2 \
    mvn -B -pl backend-service -am -DskipTests package

# ---------- Stage 2: runtime ----------
FROM eclipse-temurin:11-jre-alpine
RUN addgroup -S app && adduser -S app -G app
WORKDIR /app
COPY --from=build /workspace/backend-service/target/blood-donation-service.jar app.jar
USER app

ENV JAVA_OPTS="-XX:MaxRAMPercentage=75 -Djava.security.egd=file:/dev/./urandom"
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:8080/actuator/health | grep -q '"status":"UP"' || exit 1

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
