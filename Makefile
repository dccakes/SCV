.PHONY: migrate db-reset db-start db-stop db-restart db-logs db-status help

# Default target
help:
	@echo "Available commands:"
	@echo ""
	@echo "Docker Database Commands:"
	@echo "  make db-start    - Start PostgreSQL database container"
	@echo "  make db-stop     - Stop PostgreSQL database container"
	@echo "  make db-restart  - Restart PostgreSQL database container"
	@echo "  make db-logs     - View database container logs"
	@echo "  make db-status   - Check database container status"
	@echo ""
	@echo "Prisma Commands:"
	@echo "  make migrate     - Run Prisma migrations"
	@echo "  make db-reset    - Reset database (⚠️  DESTRUCTIVE - drops all data)"
	@echo ""

# ==========================================
# Docker Database Commands
# ==========================================

# Start database container
db-start:
	@echo "Starting PostgreSQL database container..."
	docker compose up -d postgres
	@echo "✓ Database started. Waiting for health check..."
	@sleep 2
	@docker compose ps postgres

# Stop database container
db-stop:
	@echo "Stopping PostgreSQL database container..."
	docker compose stop postgres
	@echo "✓ Database stopped"

# Restart database container
db-restart:
	@echo "Restarting PostgreSQL database container..."
	docker compose restart postgres
	@echo "✓ Database restarted. Waiting for health check..."
	@sleep 2
	@docker compose ps postgres

# View database logs
db-logs:
	@echo "Showing PostgreSQL logs (Ctrl+C to exit)..."
	docker compose logs -f postgres

# Check database status
db-status:
	@echo "PostgreSQL container status:"
	@docker compose ps postgres
	@echo ""
	@echo "Container health:"
	@docker inspect oswp-postgres --format='{{.State.Health.Status}}' 2>/dev/null || echo "Container not running"

# ==========================================
# Prisma Commands
# ==========================================

# Run Prisma migrations
migrate:
	@echo "Running Prisma migrations..."
	npx prisma migrate dev

# Reset database (DESTRUCTIVE - only for development)
db-reset:
	@echo "⚠️  WARNING: This will destroy all data in the database!"
	@read -p "Are you sure? Type 'yes' to continue: " confirm && \
	if [ "$$confirm" = "yes" ]; then \
		PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="yes" npx prisma migrate reset --force; \
	else \
		echo "Database reset cancelled."; \
	fi
