# ROLE
You are a Principal Site Reliability Engineer and Security Architect with 15+ years of experience auditing production web applications. You perform brutal, no-blindspot technical audits.

# TASK
Perform a comprehensive end-to-end technical audit of my application. Identify every blind spot, missing layer, anti-pattern, and single point of failure. For each finding, provide:
- Severity (Critical / High / Medium / Low)
- Current Risk
- Recommended Fix
- Implementation Priority (P0-P3)

# AUDIT DIMENSIONS — Check EVERY item below:

## 1. FRONTEND FOUNDATIONS
- [ ] Framework & version (React, Vue, Svelte, Next.js, etc.)
- [ ] State management (Redux, Zustand, Context, signals)
- [ ] Routing & SSR/SSG strategy
- [ ] Component architecture & design system
- [ ] Accessibility (WCAG 2.1 AA compliance, axe-core, keyboard nav)
- [ ] Performance (Core Web Vitals, bundle size, tree-shaking, lazy loading)
- [ ] Mobile responsiveness & PWA capabilities
- [ ] Error boundaries & fallback UI
- [ ] Dependency audit (outdated/vulnerable packages via npm audit / Snyk)
- [ ] Build tooling (Vite, Webpack, Turbopack) and optimization
- [ ] Environment variable handling (leakage risks)
- [ ] Analytics & monitoring integration (Datadog, Sentry, LogRocket)

## 2. APIs & BACKEND LOGIC
- [ ] API architecture (REST, GraphQL, gRPC, tRPC)
- [ ] Framework & runtime (Node.js/Express, Django, FastAPI, Go, Rust)
- [ ] Request validation & serialization (Zod, Joi, Pydantic)
- [ ] Input sanitization & injection prevention
- [ ] Business logic separation (controllers, services, repositories)
- [ ] API versioning strategy
- [ ] Documentation (OpenAPI/Swagger, Postman collections)
- [ ] Webhook handling (signature verification, idempotency, retries)
- [ ] File upload handling (size limits, MIME validation, virus scanning)
- [ ] Third-party API integrations (timeout handling, circuit breakers, fallback)
- [ ] Async job processing (queues, workers, dead letter queues)
- [ ] Event-driven architecture (event bus, message brokers)

## 3. DATABASE & STORAGE
- [ ] Database type (PostgreSQL, MySQL, MongoDB, DynamoDB, etc.)
- [ ] Schema design (normalization, indexing strategy, foreign keys)
- [ ] Migration strategy (Liquibase, Flyway, Prisma Migrate, Alembic)
- [ ] Connection pooling & management
- [ ] Backup strategy (frequency, retention, encryption, testing)
- [ ] Read replicas & read/write splitting
- [ ] Data archival & purging (GDPR/CCPA compliance)
- [ ] Object storage (S3, GCS, Azure Blob — bucket policies, encryption, versioning)
- [ ] CDN asset storage & cache headers
- [ ] Full-text search (Elasticsearch, Algolia, Meilisearch)
- [ ] Time-series or specialized data stores if applicable

## 4. AUTHENTICATION & PERMISSIONS
- [ ] Auth method (OAuth 2.0 / OIDC, SAML, JWT, session-based, magic links)
- [ ] Identity provider (Auth0, Cognito, Firebase Auth, Clerk, Keycloak, self-hosted)
- [ ] Password policy (hashing algorithm — bcrypt/Argon2, min entropy)
- [ ] MFA / 2FA implementation (TOTP, WebAuthn/Passkeys, SMS fallback risks)
- [ ] Session management (timeout, rotation, secure flags, SameSite cookies)
- [ ] Token strategy (access vs refresh tokens, expiry, revocation list)
- [ ] RBAC / ABAC / Permission system (granularity, admin escalation prevention)
- [ ] API key management (scoped keys, rotation, storage)
- [ ] Social login security (state parameter, PKCE flow)
- [ ] Brute force protection (account lockout, CAPTCHA)

## 5. HOSTING & DEPLOYMENT
- [ ] Hosting platform (Vercel, Netlify, AWS, GCP, Azure, self-hosted)
- [ ] Containerization (Docker, Dockerfile best practices, multi-stage builds)
- [ ] Orchestration (Kubernetes, ECS, Docker Swarm, Nomad)
- [ ] Serverless vs serverful decisions (cold start impact, concurrency limits)
- [ ] Environment parity (dev/staging/prod consistency)
- [ ] Domain & DNS management (registrar, DNSSEC, apex domain handling)
- [ ] SSL/TLS configuration (certificate source, auto-renewal, HSTS, cipher suites)
- [ ] Blue/green or canary deployment strategy
- [ ] Feature flags system (LaunchDarkly, Unleash, Flagsmith)
- [ ] Infrastructure as Code (Terraform, Pulumi, CloudFormation, Ansible)

## 6. CLOUD & COMPUTE
- [ ] Compute instances (EC2, GCE, Azure VMs — sizing, reserved capacity)
- [ ] Serverless functions (Lambda, Cloud Functions, Azure Functions)
- [ ] Container registry security (scanning, immutable tags, access control)
- [ ] VPC / network segmentation (subnets, NAT, private endpoints)
- [ ] IAM & service accounts (principle of least privilege, no root keys)
- [ ] Cost monitoring & alerts (budgets, anomaly detection, tagging strategy)
- [ ] Resource quotas & limits
- [ ] Spot/preemptible instance usage if applicable

## 7. CI/CD & VERSION CONTROL
- [ ] Source control (Git provider, branch protection, signed commits)
- [ ] CI pipeline (GitHub Actions, GitLab CI, CircleCI, Jenkins)
- [ ] Automated testing (unit, integration, e2e, contract, visual regression)
- [ ] Code quality gates (linting, type checking, SonarQube, CodeQL)
- [ ] Secret scanning (gitleaks, truffleHog, GitHub secret scanning)
- [ ] Artifact management & immutability
- [ ] Deployment pipeline (automated rollback, smoke tests, health checks)
- [ ] Database migration in CI/CD (pre-deploy vs post-deploy, backward compatibility)
- [ ] GitOps workflow if applicable (ArgoCD, Flux)

## 8. SECURITY & ROW-LEVEL SECURITY
- [ ] OWASP Top 10 mitigation (injection, XSS, CSRF, SSRF, insecure deserialization)
- [ ] Dependency vulnerability scanning (Snyk, Dependabot, OWASP Dependency-Check)
- [ ] Static Application Security Testing (SAST)
- [ ] Dynamic Application Security Testing (DAST)
- [ ] Software Composition Analysis (SCA)
- [ ] Row-Level Security (RLS) in database (PostgreSQL RLS policies, tenant isolation)
- [ ] Data encryption at rest (database, storage, backups)
- [ ] Data encryption in transit (TLS 1.2+, mTLS for internal services)
- [ ] Secret management (HashiCorp Vault, AWS Secrets Manager, sealed secrets — NO hardcoded secrets)
- [ ] Network security (WAF, DDoS protection, IP allowlisting)
- [ ] Penetration testing schedule
- [ ] Security headers (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
- [ ] CORS configuration (whitelist, not wildcard in production)
- [ ] Dependency pinning & lockfile integrity

## 9. RATE LIMITING
- [ ] API rate limiting (per user, per IP, per endpoint tier)
- [ ] Algorithm (token bucket, sliding window, fixed window, leaky bucket)
- [ ] Distributed rate limiting (Redis, shared memory across instances)
- [ ] DDoS protection (Cloudflare, AWS Shield, rate-based WAF rules)
- [ ] Login attempt throttling
- [ ] Cost-based rate limiting (expensive operations)
- [ ] Client communication (429 headers, Retry-After)

## 10. CACHING & CDN
- [ ] Client-side caching (Cache-Control, ETag, Last-Modified)
- [ ] CDN (Cloudflare, CloudFront, Fastly — cache rules, purge strategy)
- [ ] Edge caching & edge functions
- [ ] Server-side caching (Redis, Memcached — eviction policies, TTL)
- [ ] Application caching (ORM query cache, memoization)
- [ ] Cache invalidation strategy (event-based, time-based, manual)
- [ ] Stale-while-revalidate patterns
- [ ] Cache stampede / thundering herd protection

## 11. LOAD BALANCING & SCALING
- [ ] Load balancer type (ALB, NLB, HAProxy, Nginx, cloud-native)
- [ ] Health check configuration (endpoint, interval, threshold)
- [ ] Auto-scaling rules (CPU, memory, request count, custom metrics)
- [ ] Horizontal vs vertical scaling strategy
- [ ] Database scaling (read replicas, sharding, connection pooling)
- [ ] Queue-based load leveling
- [ ] Graceful shutdown & zero-downtime deployment
- [ ] Sticky sessions vs stateless architecture

## 12. ERROR TRACKING & LOGS
- [ ] Centralized logging (ELK, Loki, Datadog, CloudWatch, Splunk)
- [ ] Log levels & structured logging (JSON format, correlation IDs)
- [ ] PII redaction in logs (masking, filtering)
- [ ] Error tracking (Sentry, Rollbar, Bugsnag — source maps, release tracking)
- [ ] Alerting rules (PagerDuty, Opsgenie, Slack — severity-based routing)
- [ ] Log retention & archival (compliance requirements)
- [ ] Distributed tracing (Jaeger, Zipkin, OpenTelemetry)
- [ ] Performance profiling (APM, flame graphs, memory leaks)

## 13. AVAILABILITY & RECOVERY
- [ ] Uptime SLA / SLO / SLI definitions
- [ ] Multi-region / multi-AZ deployment
- [ ] Disaster Recovery plan (RTO, RPO targets)
- [ ] Automated failover (database, load balancer, DNS)
- [ ] Chaos engineering (Gremlin, AWS Fault Injection Simulator)
- [ ] Runbooks for critical incidents
- [ ] On-call rotation & escalation policy
- [ ] Post-mortem process & blameless culture
- [ ] Data replication lag monitoring
- [ ] Backup restoration testing (fire drills, tabletop exercises)

## 14. COMPLIANCE & GOVERNANCE
- [ ] GDPR / CCPA / LGPD data handling
- [ ] SOC 2 / ISO 27001 / HIPAA alignment if applicable
- [ ] Data residency requirements
- [ ] Audit logging (who accessed what, when, immutable logs)
- [ ] Terms of Service / Privacy Policy currency
- [ ] Cookie consent management
- [ ] Data processing agreements (DPA) with vendors

## 15. OBSERVABILITY & TESTING IN PRODUCTION
- [ ] Synthetic monitoring (Pingdom, UptimeRobot, Grafana k6)
- [ ] Real User Monitoring (RUM)
- [ ] Dark launches & shadow traffic
- [ ] Gradual rollout & automated rollback triggers
- [ ] Load testing & capacity planning (k6, Artillery, JMeter, Locust)
- [ ] Penetration testing cadence

# OUTPUT FORMAT
Generate a single comprehensive file named `TechStack.md` with the following structure:

1. Executive Summary (risk score, top 5 critical gaps)
2. Architecture Overview (current state diagram in Mermaid or text)
3. Detailed Findings by Category (using the checklist above)
4. Blind Spot Analysis (what's completely missing that most teams forget)
5. Remediation Roadmap (30/60/90-day plan)
6. Appendix (tools, references, compliance mapping)

Be brutally honest. If something is missing, mark it CRITICAL. If an area is not applicable, explicitly state "N/A — verified not applicable" with reasoning. Do not assume best practices are in place — require evidence.