FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir --timeout 1000 --retries 10 -r requirements.txt && \
    pip install --no-cache-dir --timeout 1000 --retries 10 --no-deps xgboost==3.0.2

COPY app ./app
COPY models ./models

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]