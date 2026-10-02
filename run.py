#!/usr/bin/env python
"""HomeResource Single-Command Launcher.

Runs the FastAPI application on http://localhost:8000 and opens the browser.
"""

import os
import sys
import webbrowser

# Force Pure-Python mode on Windows to avoid DLL policy restrictions
os.environ["DISABLE_SQLALCHEMY_CEXT"] = "1"
os.environ["PYTHONPATH"] = os.path.dirname(os.path.abspath(__file__))

if __name__ == "__main__":
    print("=" * 60)
    print("  HomeResource — Household Resource Intelligence Platform")
    print("=" * 60)
    print("\nApplication server ready at:")
    print("  -> http://localhost:8000")
    print("  -> http://127.0.0.1:8000")
    print("  (Note: Browsers cannot open 0.0.0.0 - use localhost or 127.0.0.1)")
    print("\nPress CTRL+C to stop.\n")

    import uvicorn
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)
