# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: 2025 Jonathan D.A. Jewell

FROM denoland/deno:2.1.4

WORKDIR /app

# Copy source files
COPY index.js deno.json ./
COPY adapters/ ./adapters/
COPY lib/ ./lib/
COPY src/ ./src/

# Cache dependencies
RUN deno cache index.js

# Create non-root user
RUN adduser --disabled-password --gecos '' polyglot
USER polyglot

# MCP server runs on stdio, expose for HTTP mode if needed
EXPOSE 8080

# Default command
CMD ["deno", "run", "--allow-net", "--allow-read", "--allow-write", "--allow-env", "index.js"]
