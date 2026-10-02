.PHONY: help install run test lint docker-build docker-up

help:
	@echo "HomeResource Development Commands:"
	@echo "  make install      Install backend dependencies"
	@echo "  make run          Start FastAPI backend and frontend server"
	@echo "  make test         Execute pytest test suite"
	@echo "  make docker-build Build multi-stage Docker container"
	@echo "  make docker-up    Run full application stack with PostgreSQL & Nginx"

install:
	pip install -r requirements.txt

run:
	uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload

test:
	pytest -v tests/

docker-build:
	docker build -f infrastructure/Dockerfile -t homeresource:latest .

docker-up:
	cd infrastructure && docker compose up -d
