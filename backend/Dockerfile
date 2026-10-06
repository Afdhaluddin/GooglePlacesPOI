# ---------------------------------------------------------------------------
# Stage 1: build the jar with Maven
# ---------------------------------------------------------------------------
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q -B dependency:go-offline
COPY src ./src
RUN mvn -q -B -DskipTests package

# ---------------------------------------------------------------------------
# Stage 2: slim JRE runtime
# ---------------------------------------------------------------------------
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/favourite-places-1.0.0.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
