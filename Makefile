.PHONY: migrate db-reset help

# Default target
help:
	@echo "Available commands:"
	@echo "  make migrate   - Run Prisma migrations"
	@echo "  make db-reset  - Reset database (⚠️  DESTRUCTIVE - drops all data)"

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
