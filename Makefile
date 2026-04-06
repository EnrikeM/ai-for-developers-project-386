FRONTEND_DIR := frontend
BACKEND_DIR := backend

.PHONY: build build-frontend build-backend dev dev-frontend dev-backend

build: build-frontend build-backend

build-frontend:
	npm --prefix $(FRONTEND_DIR) run build

build-backend:
	cd $(BACKEND_DIR) && go build ./...

dev:
	npm --prefix $(FRONTEND_DIR) run dev & \
	(cd $(BACKEND_DIR) && go run .) & \
	wait

dev-frontend:
	npm --prefix $(FRONTEND_DIR) run dev

dev-backend:
	cd $(BACKEND_DIR) && go run .
