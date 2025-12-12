# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: 2025 Jonathan D.A. Jewell
#
# Containerfile - works with podman, nerdctl, docker, buildah
# Uses official Deno image (distroless-based, minimal attack surface)
# Alternative: cerro-terro or Chainguard Wolfi (when available/authenticated)

FROM denoland/deno:2.1.4

WORKDIR /app

# Copy source files
COPY index.js deno.json ./
COPY adapters/ ./adapters/
COPY lib/ ./lib/
COPY src/ ./src/

# Cache dependencies using deno.json config
RUN deno cache --config=deno.json index.js

# Create non-root user
RUN addgroup --system polyglot && adduser --system --ingroup polyglot polyglot
USER polyglot

# MCP server runs on stdio, expose for HTTP mode if needed
EXPOSE 8080

# Default entrypoint using deno.json config
ENTRYPOINT ["deno", "run", "--config=deno.json", "--allow-net", "--allow-read", "--allow-write", "--allow-env", "--unstable-kv", "index.js"]
