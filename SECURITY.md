# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of SCV seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Please Do

- **Report security vulnerabilities privately** - Do not create public GitHub issues for security vulnerabilities
- **Provide detailed reports** - Include steps to reproduce, potential impact, and suggested fixes if possible
- **Give us reasonable time** - Allow us time to investigate and address the issue before public disclosure

### Please Don't

- **Don't exploit vulnerabilities** - Beyond what is necessary to demonstrate the issue
- **Don't access other users' data** - Even for testing purposes
- **Don't perform attacks** - That could harm the reliability or integrity of our services

## How to Report

### Option 1: GitHub Security Advisories (Preferred)

1. Go to the [Security tab](https://github.com/dccakes/SCV/security) of this repository
2. Click "Report a vulnerability"
3. Fill out the vulnerability report form

### Option 2: Email

If you prefer email, contact the maintainers directly through their GitHub profiles.

## What to Include

Please include the following information in your report:

- **Type of vulnerability** (e.g., SQL injection, XSS, authentication bypass)
- **Location** - Full paths of source file(s) related to the issue
- **Steps to reproduce** - A step-by-step description of how to reproduce the issue
- **Proof of concept** - Code or screenshots demonstrating the vulnerability
- **Impact** - What an attacker could achieve with this vulnerability
- **Suggested fix** - If you have recommendations for how to fix the issue

## Response Timeline

- **Initial Response**: Within 48 hours of receiving your report
- **Status Update**: Within 7 days with our assessment
- **Resolution Timeline**: Depends on severity, typically:
  - Critical: 24-48 hours
  - High: 7 days
  - Medium: 30 days
  - Low: 90 days

## Security Best Practices for Self-Hosting

If you're self-hosting SCV, please follow these security guidelines:

### Environment Variables

- **Never commit `.env` files** to version control
- **Use strong secrets** for `BETTER_AUTH_SECRET` (32+ random characters)
- **Rotate secrets** periodically
- **Use different credentials** for development and production

### Database

- **Use strong passwords** for PostgreSQL
- **Enable SSL** for database connections in production
- **Restrict network access** to your database
- **Regular backups** with encryption

### Authentication

- **Enable OAuth providers** (GitHub, Google) for secure authentication
- **Use HTTPS** in production for `BETTER_AUTH_URL`
- **Review session settings** for your security requirements

### Deployment

- **Keep dependencies updated** - Run `npm audit` regularly
- **Use HTTPS** - Never deploy without TLS
- **Set security headers** - CSP, HSTS, etc.
- **Regular updates** - Keep Node.js and all dependencies current

### Docker Deployment

- **Don't run as root** - Our Dockerfile uses a non-root user
- **Use secrets management** - Don't pass secrets via environment variables in production
- **Scan images** - Use tools like Trivy to scan for vulnerabilities
- **Keep base images updated** - Regularly rebuild with latest base images

## Known Security Considerations

### Data Stored

SCV stores the following sensitive data:
- User account information (email, name)
- Wedding guest information (names, emails, addresses)
- RSVP responses

### Third-Party Services

- **Better Auth** - Self-hosted authentication (no external auth service)
- **AWS S3** (optional) - For image uploads, ensure proper bucket policies
- **OAuth Providers** (optional) - GitHub, Google authentication

## Acknowledgments

We appreciate the security research community and will acknowledge researchers who responsibly disclose vulnerabilities (unless they prefer to remain anonymous).

---

Thank you for helping keep SCV and its users safe!
