.PHONY: run test cover

run:
	@echo "Running the program..."
	go mod tidy
	go run .

tidy:
	@echo "Tidying module dependencies..."
	go mod tidy
	
test:
	@echo "Running the tests..."
	go test -v ./...

cover:
	@echo "Running the tests with coverage..."
	go test -cover ./... -coverprofile=cover.out
	go tool cover -html=cover.out

