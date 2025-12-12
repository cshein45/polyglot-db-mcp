# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: 2025 Jonathan D.A. Jewell
#
# Containerfile - works with podman, nerdctl, docker, buildah
# Uses Chainguard Wolfi base for security (minimal attack surface, no shell)
# Alternative: cerro-terro (when available)

# Wolfi-based Deno image from Chainguard
FROM cgr.dev/chainguard/deno:latest

WORKDIR /app

# Copy source files
COPY index.js deno.json ./
COPY adapters/ ./adapters/
COPY lib/ ./lib/
COPY src/ ./src/

# Cache dependencies (run as root during build)
USER root
RUN deno cache index.js

# Run as non-root for security
USER nonroot

# MCP server runs on stdio, expose for HTTP mode if needed
EXPOSE 8080

# Default entrypoint
ENTRYPOINT ["deno", "run", "--allow-net", "--allow-read", "--allow-write", "--allow-env", "index.js"]
