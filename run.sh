#!/usr/bin/env bash
export DISABLE_SQLALCHEMY_CEXT=1
echo "Starting HomeResource application server at http://localhost:8000"
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
