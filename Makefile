.PHONY: help install build deploy deploy-guided local-api frontend-dev clean test lint

# Default target
help:
	@echo "AWS Invoice Processing Pipeline - Automation Commands"
	@echo "======================================================="
	@echo "Available targets:"
	@echo "  install         - Install dependencies for all backend lambdas and frontend"
	@echo "  build           - Build the application using SAM"
	@echo "  deploy          - Deploy the application to AWS (uses samconfig.toml)"
	@echo "  deploy-guided   - Deploy the application interactively"
	@echo "  local-api       - Run API Gateway locally"
	@echo "  frontend-dev    - Start the frontend Vite development server"
	@echo "  test            - Run all unit and integration tests"
	@echo "  lint            - Lint the codebase (frontend & backend lambdas)"
	@echo "  clean           - Clean up build artifacts and node_modules"

LAMBDAS = approval-handler audit-logger bedrock-validator invoice-ingestion textract-processor

install:
	@echo "Installing dependencies..."
	@for dir in $(LAMBDAS); do \
		echo "Installing dependencies for backend/lambdas/$$dir..."; \
		cd backend/lambdas/$$dir && pnpm install && cd - > /dev/null; \
	done
	@echo "Installing dependencies for frontend..."
	@cd frontend && pnpm install && cd - > /dev/null

build:
	@echo "Building application with SAM..."
	sam build -t infrastructure/template.yaml --build-in-source

deploy:
	@echo "Deploying application to AWS..."
	sam deploy -t .aws-sam/build/template.yaml --config-file $(CURDIR)/samconfig.toml

deploy-guided:
	@echo "Deploying application interactively to AWS..."
	sam deploy --guided -t .aws-sam/build/template.yaml --config-file $(CURDIR)/samconfig.toml

local-api:
	@echo "Starting local API Gateway..."
	sam local start-api -t .aws-sam/build/template.yaml

frontend-dev:
	@echo "Starting frontend development server..."
	cd frontend && pnpm run dev

test:
	@echo "Running tests..."
	cd tests && pnpm run test

lint:
	@echo "Linting backend Lambdas..."
	@for dir in $(LAMBDAS); do \
		echo "Linting backend/lambdas/$$dir..."; \
		cd backend/lambdas/$$dir && pnpm run lint || echo "No lint script or lint failed in $$dir"; \
		cd - > /dev/null; \
	done
	@echo "Linting frontend..."
	@cd frontend && pnpm run lint || echo "No lint script or lint failed in frontend"

clean:
	@echo "Cleaning build artifacts..."
	rm -rf .aws-sam
	@for dir in $(LAMBDAS); do \
		echo "Cleaning backend/lambdas/$$dir..."; \
		rm -rf backend/lambdas/$$dir/dist backend/lambdas/$$dir/node_modules; \
	done
	@echo "Cleaning frontend..."
	rm -rf frontend/dist frontend/node_modules
