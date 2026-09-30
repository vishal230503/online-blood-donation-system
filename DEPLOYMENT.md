# Deployment Guide

Stack: Spring Boot 2.2 (Java 8 target, built/run on JDK 11) x 2 microservices, React 16 UI, PostgreSQL 15.

```
Browser -> nginx (frontend, :80) --/address-api/--> address-service :9090 --> Postgres (address-db)
                                 --/backend-api/--> backend-service :8080 --> Postgres (obds)
                                                    backend-service --> address-service (ADDRESS_SERVICE_URL)
```

## 1. Run the whole app (Docker only)
```bash
cp .env.example .env        # set DB_PASSWORD
docker compose up -d --build
# open http://localhost   (HTTP_PORT in .env changes the port)
```
Health: `/actuator/health` on both services (used by Docker HEALTHCHECK).

## 2. Local build without Docker
```bash
mvn clean verify                      # builds common-lib, address-service, backend-service + JaCoCo report
cd frontend-service && npm ci && npm start
```
Service settings are environment variables with local defaults: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`,
`DDL_AUTO`, `SHOW_SQL`, `SERVER_PORT`, `ADDRESS_SERVICE_URL`.

## 3. Security / quality tooling

| Tool | How it is wired |
|---|---|
| Maven | Root `pom.xml` aggregates `common-lib`, `address-service`, `backend-service` |
| OWASP Dependency-Check | `mvn dependency-check:aggregate` (reports in `target/dependency-check-report.*`). Threshold: `-Ddependency-check.failBuildOnCVSS=7`. Suppressions: `security/dependency-check-suppressions.xml`. Pass `-Dnvd.api.key=...` (free key from nvd.nist.gov) or NVD updates will be very slow |
| SonarQube (Java) | `mvn sonar:sonar -Dsonar.host.url=... -Dsonar.token=...` (coverage from JaCoCo) |
| SonarQube (React) | `cd frontend-service && sonar-scanner` (uses `sonar-project.properties`) |
| Dockerfiles | `address-service/Dockerfile`, `backend-service/Dockerfile` (build context = repo root), `frontend-service/Dockerfile` (+ `nginx.conf`) |

## 4. Jenkins + SonarQube setup
```bash
export SONAR_DB_PASSWORD=choose-one
docker compose -f jenkins/docker-compose.ci.yml up -d --build
# Jenkins http://localhost:8081   SonarQube http://localhost:9000 (admin/admin -> change it)
```
**Jenkins plugins** (pre-installed by `jenkins/Dockerfile`): Pipeline, Git, Credentials Binding, Timestamps,
Workspace Cleanup, JUnit, NodeJS, SonarQube Scanner, OWASP Dependency-Check.

**Manage Jenkins > Tools** (names must match the Jenkinsfile): JDK `JDK-11`, Maven `Maven-3.9`, NodeJS `Node-16`, SonarQube Scanner `SonarScanner`.

**Manage Jenkins > System > SonarQube servers**: name `SonarQube`, URL `http://sonarqube:9000`, token credential.
In SonarQube add a webhook `http://jenkins:8080/sonarqube-webhook/` (required for the quality-gate stages).

**Credentials** (Manage Jenkins > Credentials):
| ID | Type | Purpose |
|---|---|---|
| `nvd-api-key` | Secret text | NVD API key for Dependency-Check |
| `docker-registry-creds` | Username/password | Push images |
| `obds-env-file` | Secret file | Production `.env` (DB password etc.) |
| Sonar token | Secret text | Referenced by the SonarQube server entry |

Create a **Pipeline from SCM** job pointing at this repo (`Jenkinsfile` at the root), then "Build with Parameters".

Pipeline stages: Checkout > Maven build+test > OWASP scan > Sonar (Java) + gate > Sonar (UI) + gate > npm audit > Docker build > (push) > (deploy).

## 5. Before going live: known issues
1. **Outdated Spring Boot 2.2.x (end-of-life)**: OWASP will report many CVEs. The pipeline ships in *report-only* mode
   (`FAIL_ON_CVSS=11`, `ENFORCE_QUALITY_GATE=false`) so the first run is green. Upgrade Spring Boot (2.7.x is the
   last Java 8 line, then 3.x), then set `FAIL_ON_CVSS=7` and tick `ENFORCE_QUALITY_GATE`.
2. **No unit tests exist**, so Sonar coverage is 0%. Add tests before enforcing the gate on coverage.
3. **No authentication on the APIs**: the admin login is client-side only, and CORS is `*`
   (`common-lib/.../WebConfig.java`). Anyone who can reach the ports can read/modify data. Add Spring Security
   before exposing this to the internet, and only publish the frontend port (the compose file already does).
4. **TLS**: put a reverse proxy / load balancer with HTTPS in front of the frontend container.
5. `DDL_AUTO=update` lets Hibernate change the schema; use Flyway/Liquibase and `validate` for real production.
6. Donor photos / prescriptions are stored by the backend as uploaded (max 10 MB); back up the `pgdata` volume.

## 6. What was changed in the original code
- New root `pom.xml`; the three modules now inherit from it (backend moved Spring Boot 2.2.1 -> 2.2.4 to match the others).
- `spring-boot-starter-actuator` added to both services (health checks).
- `application.properties` values are now env-overridable (defaults = old values, `show-sql` now defaults to false).
- `AddressApiClient` reads `address.service.url` instead of a hardcoded `http://localhost:9090`.
- Frontend: API URLs moved to `src/config.js` (`REACT_APP_ADDRESS_API`, `REACT_APP_BACKEND_API`);
  `package.json` synced to the lockfile (`react-scripts` ^5.0.1) and Windows-only `set NODE_OPTIONS` removed;
  `package-lock.json` regenerated (the old one didn't match `package.json`, so `npm ci` failed).
