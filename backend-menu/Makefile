.PHONY: run build test test-coverage test-coverage-html swagger docker-up docker-down docker-dev-up docker-dev-down migrate clean

# Run the server locally
run:
	go run ./cmd/server

# Build the binary
build:
	go build -o bin/server ./cmd/server

# Run all tests
test:
	go test ./... -v -count=1

# Run tests with coverage report
test-coverage:
	go test ./... -coverprofile=coverage.out -covermode=atomic
	go tool cover -func=coverage.out

# Run tests with HTML coverage report
test-coverage-html: test-coverage
	go tool cover -html=coverage.out -o coverage.html

# Generate Swagger documentation
swagger:
	swag init -g cmd/server/main.go -o docs

# Run production Docker containers
docker-up:
	docker-compose up --build -d

# Stop production Docker containers
docker-down:
	docker-compose down

# Run development Docker containers (with hot-reload)
docker-dev-up:
	docker-compose -f docker-compose.dev.yml up --build -d

# Stop development Docker containers
docker-dev-down:
	docker-compose -f docker-compose.dev.yml down

# Run database migrations manually
migrate:
	@echo "Migrations are auto-applied on server startup"

# Clean build artifacts
clean:
	rm -rf bin/ tmp/ docs/
