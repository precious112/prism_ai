FROM python:3.11-slim

WORKDIR /app

# Install uv
RUN pip install uv

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Install dependencies using uv
RUN uv sync --frozen

# Copy source code
COPY . .

# Set environment variables
ENV PYTHONUNBUFFERED=1

# Command to run the worker using uv run (handles venv)
CMD ["uv", "run", "python", "src/worker.py"]
