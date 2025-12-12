# Polyglot DB MCP

**One MCP server. 16 databases. Zero context switching.**

Query PostgreSQL, MongoDB, Neo4j, Elasticsearch, Redis, and 11 more databases through a single unified interface. Built with ReScript, runs on Deno.

[![License: MIT OR AGPL-3.0](https://img.shields.io/badge/License-MIT%20OR%20AGPL--3.0-blue.svg)](LICENSE.txt)
[![Runtime: Deno](https://img.shields.io/badge/Runtime-Deno-black.svg)](https://deno.land)
[![Language: ReScript](https://img.shields.io/badge/Language-ReScript-red.svg)](https://rescript-lang.org)

---

## Why Polyglot DB?

Modern applications use multiple databases — SQL for transactions, Redis for caching, Elasticsearch for search, vectors for AI. Switching between CLIs, APIs, and query languages is exhausting.

**Polyglot DB MCP** gives Claude (and other MCP clients) direct access to all your databases through natural language:

> "Find all users in PostgreSQL who signed up last week, then check if they're in the Redis cache"

> "Search Elasticsearch for 'authentication errors' and correlate with the MongoDB audit log"

> "Store this embedding in Qdrant and link it to the Neo4j knowledge graph"

---

## Installation

### Option A: Direct (Recommended for development)

```bash
# Clone the repository
git clone https://github.com/hyperpolymath/polyglot-db-mcp.git
cd polyglot-db-mcp

# Add to Claude Code
claude mcp add polyglot-db -- deno run \
  --allow-net --allow-read --allow-write --allow-env \
  $(pwd)/index.js
```

### Option B: Container (Recommended for production)

```bash
# Using nerdctl (containerd)
nerdctl run -d --name polyglot-db \
  -e POSTGRES_HOST=host.docker.internal \
  -e MONGODB_URL=mongodb://host.docker.internal:27017 \
  ghcr.io/hyperpolymath/polyglot-db-mcp:latest

# Using podman
podman run -d --name polyglot-db \
  -e POSTGRES_HOST=host.containers.internal \
  ghcr.io/hyperpolymath/polyglot-db-mcp:latest

# Using docker
docker run -d --name polyglot-db \
  -e POSTGRES_HOST=host.docker.internal \
  ghcr.io/hyperpolymath/polyglot-db-mcp:latest
```

### Option C: Deno Deploy (Serverless)

```bash
# Deploy directly to Deno Deploy
deployctl deploy --project=polyglot-db index.js
```

---

## Quick Start

### 1. Configure your databases

Create a `.env` file or export environment variables:

```bash
# Example: PostgreSQL + Redis + Elasticsearch
export POSTGRES_HOST=localhost POSTGRES_DATABASE=myapp
export DRAGONFLY_HOST=localhost
export ELASTICSEARCH_URL=http://localhost:9200
```

### 2. Ask Claude

```
"What databases are connected?"
"Show me the schema of the users table in PostgreSQL"
"Cache this result in Redis with a 1 hour TTL"
```

---

## Supported Databases

### Relational

| Database | License | Best For | Tools |
|----------|---------|----------|-------|
| **PostgreSQL** | PostgreSQL (FOSS) | Complex queries, ACID, extensions (PostGIS, pgvector) | `pg_*` |
| **MariaDB** | GPL v2 (FOSS) | Web apps, MySQL compatibility | `maria_*` |
| **SQLite** | Public Domain | Local storage, embedded, single-file | `sqlite_*` |

### Document

| Database | License | Best For | Tools |
|----------|---------|----------|-------|
| **MongoDB** | SSPL | Flexible schemas, horizontal scaling | `mongo_*` |
| **SurrealDB** | BSL/Apache 2.0 | Multi-model (doc + graph + SQL) | `surreal_*` |

### Graph

| Database | License | Best For | Tools |
|----------|---------|----------|-------|
| **Neo4j** | GPL v3 / Commercial | Relationships, social networks, fraud detection | `neo4j_*` |

### Cache & Key-Value

| Database | License | Best For | Tools |
|----------|---------|----------|-------|
| **Dragonfly** | BSL | Redis replacement, 25x faster | `dragonfly_*` |
| **Memcached** | BSD (FOSS) | Simple distributed caching | `memcached_*` |
| **LMDB** | OpenLDAP (FOSS) | Embedded KV with ACID | `lmdb_*` |

### Search

| Database | License | Best For | Tools |
|----------|---------|----------|-------|
| **Elasticsearch** | Elastic License 2.0 | Full-text search, log analytics | `es_*` |
| **Meilisearch** | MIT (FOSS) | Instant, typo-tolerant search | `meili_*` |

### Vector

| Database | License | Best For | Tools |
|----------|---------|----------|-------|
| **Qdrant** | Apache 2.0 (FOSS) | AI embeddings, semantic search | `qdrant_*` |

### Time Series

| Database | License | Best For | Tools |
|----------|---------|----------|-------|
| **InfluxDB** | MIT (v1) | IoT, monitoring, metrics | `influx_*` |

### Analytics

| Database | License | Best For | Tools |
|----------|---------|----------|-------|
| **DuckDB** | MIT (FOSS) | OLAP, query CSV/Parquet/JSON directly | `duck_*` |

### Specialized

| Database | License | Best For | Tools |
|----------|---------|----------|-------|
| **XTDB** | MIT (FOSS) | Bitemporal queries, audit trails | `xtdb_*` |
| **iTop** | AGPL v3 (FOSS) | IT asset management, CMDB | `itop_*` |

**License Key:** FOSS = Free & Open Source | Source-Available = viewable but restricted

---

## Configuration

Each database reads from environment variables. Only configure what you need.

<details>
<summary><b>PostgreSQL</b></summary>

```bash
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=mydb
POSTGRES_USER=postgres
POSTGRES_PASSWORD=secret

# Connection pool (optional)
POSTGRES_POOL_MAX=10         # Max connections
POSTGRES_IDLE_TIMEOUT=30     # Seconds before idle connection closed
POSTGRES_CONNECT_TIMEOUT=10  # Connection timeout in seconds
```
</details>

<details>
<summary><b>MongoDB</b></summary>

```bash
MONGODB_URL=mongodb://localhost:27017
MONGODB_DATABASE=mydb

# Connection pool (optional)
MONGODB_POOL_MAX=10           # Max connections
MONGODB_POOL_MIN=1            # Min connections
MONGODB_IDLE_TIMEOUT=30000    # Idle timeout in ms
MONGODB_CONNECT_TIMEOUT=10000 # Connect timeout in ms
MONGODB_SERVER_TIMEOUT=30000  # Server selection timeout in ms
```
</details>

<details>
<summary><b>Neo4j</b></summary>

```bash
NEO4J_URL=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=secret
```
</details>

<details>
<summary><b>Elasticsearch</b></summary>

```bash
ELASTICSEARCH_URL=http://localhost:9200
ELASTICSEARCH_USERNAME=elastic    # optional
ELASTICSEARCH_PASSWORD=secret     # optional
```
</details>

<details>
<summary><b>Dragonfly / Redis</b></summary>

```bash
DRAGONFLY_HOST=localhost
DRAGONFLY_PORT=6379
DRAGONFLY_PASSWORD=             # optional
```
</details>

<details>
<summary><b>InfluxDB</b></summary>

```bash
INFLUXDB_URL=http://localhost:8086
INFLUXDB_TOKEN=your-token
INFLUXDB_ORG=your-org
INFLUXDB_BUCKET=your-bucket
```
</details>

<details>
<summary><b>SurrealDB</b></summary>

```bash
SURREAL_URL=http://localhost:8000
SURREAL_NAMESPACE=test
SURREAL_DATABASE=test
SURREAL_USERNAME=root
SURREAL_PASSWORD=root
```
</details>

<details>
<summary><b>SQLite</b></summary>

```bash
SQLITE_PATH=./data.db     # or :memory:
```
</details>

<details>
<summary><b>DuckDB</b></summary>

```bash
DUCKDB_PATH=./analytics.db  # or :memory:
```
</details>

<details>
<summary><b>Qdrant</b></summary>

```bash
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=               # optional
```
</details>

<details>
<summary><b>Meilisearch</b></summary>

```bash
MEILISEARCH_URL=http://localhost:7700
MEILISEARCH_API_KEY=          # optional
```
</details>

<details>
<summary><b>MariaDB</b></summary>

```bash
MARIADB_HOST=localhost
MARIADB_PORT=3306
MARIADB_USER=root
MARIADB_PASSWORD=secret
MARIADB_DATABASE=mydb

# Connection pool (optional)
MARIADB_POOL_MAX=10            # Max connections
MARIADB_ACQUIRE_TIMEOUT=10000  # Acquire timeout in ms
MARIADB_IDLE_TIMEOUT=30000     # Idle timeout in ms
MARIADB_CONNECT_TIMEOUT=10000  # Connect timeout in ms
```
</details>

<details>
<summary><b>Memcached</b></summary>

```bash
MEMCACHED_SERVERS=localhost:11211
```
</details>

<details>
<summary><b>LMDB</b></summary>

```bash
LMDB_PATH=./lmdb-data
```
</details>

<details>
<summary><b>XTDB</b></summary>

```bash
XTDB_URL=http://localhost:3000
```
</details>

<details>
<summary><b>iTop</b></summary>

```bash
ITOP_URL=http://localhost/itop
ITOP_USERNAME=admin
ITOP_PASSWORD=secret
```
</details>

---

## Usage Examples

### Meta Tools

```
db_list              List all 16 supported databases
db_status            Check which databases are currently connected
db_help [database]   Get available tools for a specific database
```

### Natural Language Queries

Ask Claude things like:

**PostgreSQL:**
> "Create a users table with id, email, and created_at columns"
> "Find all orders over $100 from the last month"

**MongoDB:**
> "Insert a new document into the products collection"
> "Aggregate sales by category with a $match and $group pipeline"

**Neo4j:**
> "Find the shortest path between User:alice and User:bob"
> "Show all nodes connected to the 'Engineering' department"

**Elasticsearch:**
> "Search for documents containing 'critical error' in the logs index"
> "Get the mapping for the products index"

**Redis/Dragonfly:**
> "Set user:123:session with a 30 minute TTL"
> "Get all keys matching cache:*"

**Qdrant:**
> "Search for vectors similar to this embedding in the documents collection"
> "Create a new collection with 1536 dimensions for OpenAI embeddings"

**Cross-Database:**
> "Query users from PostgreSQL and cache the result in Redis"
> "Find products in MongoDB and index them in Meilisearch"

---

## Architecture

```
polyglot-db-mcp/
├── index.js                    # MCP server entry point
├── src/                        # ReScript source (core adapters)
│   ├── Adapter.res             # Shared types
│   ├── bindings/               # Database client FFI
│   └── adapters/               # PostgreSQL, MongoDB, SQLite, Dragonfly, Elasticsearch
├── adapters/                   # JavaScript adapters (exotic databases)
├── lib/es6/                    # Compiled ReScript output
└── STATE.scm                   # Project state tracking
```

### Language Policy

| Component | Language | Rationale |
|-----------|----------|-----------|
| Core adapters (5) | ReScript | Type safety, smaller bundles |
| Exotic adapters (11) | JavaScript | Pragmatic for v1.x |
| Future (v2.0.0) | 100% ReScript | RSR Gold compliance |

**TypeScript is prohibited.** We chose ReScript for its superior type inference and ML heritage.

---

## Development

### Building ReScript

```bash
npm install           # Install ReScript compiler
npm run res:build     # Compile to JavaScript
npm run res:watch     # Watch mode
```

### Running Locally

```bash
deno task start
# or
deno run --allow-net --allow-read --allow-write --allow-env index.js
```

### Git Hooks

Enable the pre-commit hook to enforce language policy:

```bash
git config core.hooksPath .githooks
```

---

## Adding a New Database

Create `src/adapters/YourDb.res`:

```rescript
// SPDX-License-Identifier: MIT
open Adapter

let name = "yourdb"
let description = "Your database description"

let connect = async () => { /* ... */ }
let disconnect = async () => { /* ... */ }
let isConnected = async () => { /* ... */ }

let tools: Js.Dict.t<toolDefAny> = {
  let dict = Js.Dict.empty()
  Js.Dict.set(dict, "yourdb_query", {
    description: "Execute a query",
    params: makeParams([("query", stringParam("Query to run"))]),
    handler: queryHandler,
  })
  dict
}
```

Then import in `index.js` and rebuild.

---

## Roadmap

| Version | Status | Highlights |
|---------|--------|------------|
| **1.0.0** | Released | 16 databases, ReScript core, CI/CD |
| **1.1.0** | In Progress | Connection pooling, container images, better errors |
| 1.2.0 | Planned | Cross-database pipelines, caching helpers |
| 2.0.0 | Vision | 100% ReScript, RSR Gold compliance |

---

## Related Projects

- **[arango-mcp](https://github.com/hyperpolymath/arango-mcp)** — ArangoDB MCP server
- **[virtuoso-mcp](https://github.com/hyperpolymath/virtuoso-mcp)** — Virtuoso SPARQL MCP server

---

## License

**Dual-licensed:** [MIT](LICENSE.txt) OR [AGPL-3.0-or-later](LICENSE.txt) — your choice.

We encourage (but don't require) layering the [Palimpsest License](https://github.com/hyperpolymath/palimpsest-license) for ethical AI development practices.

© 2025 Jonathan D.A. Jewell ([@hyperpolymath](https://github.com/hyperpolymath))
