FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p /app/data

EXPOSE 8000

# Render (and most PaaS providers) inject a $PORT env var at runtime and
# route traffic to it, so we must bind to that instead of a fixed port.
# seed_data.py is idempotent (it no-ops if users already exist), so it's
# safe to run on every container start to guarantee the demo accounts exist.
CMD python seed_data.py; uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
