;;; ==================================================
;;; STATE.scm — Project State Checkpoint
;;; ==================================================
;;;
;;; SPDX-License-Identifier: MIT
;;; Copyright (c) 2025 Jonathan D.A. Jewell
;;;
;;; Current state of polyglot-db-mcp project
;;; Format: github.com/hyperpolymath/state.scm
;;;
;;; ==================================================

(define state
  '((metadata
      (format-version . "2.0")
      (schema-version . "2025-12-12")
      (created-at . "2025-12-12T00:00:00Z")
      (last-updated . "2025-12-12T12:00:00Z")
      (generator . "Claude/STATE-system"))

    (dublin-core
      (dc:title . "polyglot-db-mcp")
      (dc:creator . "Jonathan D.A. Jewell")
      (dc:subject . ("MCP" "databases" "Deno" "multi-database" "ReScript"))
      (dc:description . "Unified MCP server for 16 databases with ReScript core")
      (dc:publisher . "hyperpolymath")
      (dc:date . "2025-12-12")
      (dc:type . "Software")
      (dc:format . ("application/rescript" "application/javascript"))
      (dc:identifier . "https://github.com/hyperpolymath/polyglot-db-mcp")
      (dc:language . "en")
      (dc:rights . "MIT"))

    (project
      (name . "polyglot-db-mcp")
      (version . "1.0.0")
      (status . "released")
      (completion . 100)
      (category . "infrastructure")
      (runtime . "Deno")
      (primary-language . "ReScript")
      (rsr-compliance . "Bronze"))

    (focus
      (current-phase . "v1.1.0 In Progress")
      (deadline . #f)
      (blocking-projects . ()))

    (language-policy
      (primary . "ReScript")
      (prohibited . ("TypeScript"))
      (legacy . "JavaScript")
      (v1-mix . "ReScript core (5), JavaScript exotic (11)")
      (v2-target . "100% ReScript"))

    (databases-supported
      ;; Relational
      ((name . "PostgreSQL") (status . "implemented") (type . "relational")
       (license . "PostgreSQL (FOSS)") (rescript . #t))
      ((name . "MariaDB") (status . "implemented") (type . "relational")
       (license . "GPL v2 (FOSS)") (rescript . #f))
      ((name . "SQLite") (status . "implemented") (type . "embedded-sql")
       (license . "Public Domain (FOSS)") (rescript . #t))

      ;; Document
      ((name . "MongoDB") (status . "implemented") (type . "document")
       (license . "SSPL (Source-Available)") (rescript . #t))
      ((name . "SurrealDB") (status . "implemented") (type . "multi-model")
       (license . "BSL/Apache 2.0 (FOSS)") (rescript . #f))

      ;; Graph
      ((name . "Neo4j") (status . "implemented") (type . "graph")
       (license . "GPL v3 / Commercial") (rescript . #f))

      ;; Key-Value & Cache
      ((name . "Dragonfly/Redis") (status . "implemented") (type . "cache")
       (license . "BSL (Source-Available)") (rescript . #t))
      ((name . "Memcached") (status . "implemented") (type . "cache")
       (license . "BSD (FOSS)") (rescript . #f))
      ((name . "LMDB") (status . "implemented") (type . "embedded-kv")
       (license . "OpenLDAP (FOSS)") (note . "Deno.Kv backend") (rescript . #f))

      ;; Search
      ((name . "Elasticsearch") (status . "implemented") (type . "search")
       (license . "Elastic License 2.0 (Source-Available)") (rescript . #t))
      ((name . "Meilisearch") (status . "implemented") (type . "search")
       (license . "MIT (FOSS)") (rescript . #f))

      ;; Vector
      ((name . "Qdrant") (status . "implemented") (type . "vector")
       (license . "Apache 2.0 (FOSS)") (rescript . #f))

      ;; Time Series
      ((name . "InfluxDB") (status . "implemented") (type . "time-series")
       (license . "MIT (FOSS v1) / Proprietary (v2 Cloud)") (rescript . #f))

      ;; Analytics
      ((name . "DuckDB") (status . "stub") (type . "analytics")
       (license . "MIT (FOSS)") (note . "HTTP API mode") (rescript . #f))

      ;; Specialized
      ((name . "XTDB") (status . "implemented") (type . "bitemporal")
       (license . "MIT (FOSS)") (rescript . #f))
      ((name . "iTop") (status . "implemented") (type . "cmdb")
       (license . "AGPL v3 (FOSS)") (rescript . #f)))

    (rescript-adapters
      (core . ("PostgreSQL" "MongoDB" "SQLite" "Dragonfly" "Elasticsearch"))
      (bindings . ("Deno" "Postgres" "MongoDB" "Redis" "SQLite" "Fetch" "Json"))
      (compiled-output . "lib/es6/"))

    (ci-cd
      (github-actions . "language-policy, rescript-build, deno-check, lint, container-build")
      (hooks . "pre-commit enforces no TypeScript")
      (linguist . ".gitattributes marks ReScript as primary")
      (container . "ghcr.io/hyperpolymath/polyglot-db-mcp"))

    (critical-next
      ("v1.1.0: Connection pooling"
       "v1.1.0: Better error handling"
       "v2.0.0: Convert remaining 11 adapters to ReScript"
       "v2.0.0: RSR Gold compliance"))

    (issues
      ((id . "ISSUE-001")
       (severity . "low")
       (title . "DuckDB requires HTTP mode")
       (description . "Native DuckDB module doesn't compile in Deno")
       (workaround . "Use duckdb CLI or HTTP API")
       (status . "documented"))

      ((id . "ISSUE-002")
       (severity . "resolved")
       (title . "Mixed languages (JS/ReScript)")
       (description . "Core adapters now in ReScript, exotic in JS")
       (resolution . "v2.0.0 will be 100% ReScript")
       (status . "mitigated")))

    (roadmap
      ((phase . "1.0.0 - Initial Release")
       (status . "complete")
       (date . "2025-12-12")
       (goals . ("16 database adapters"
                 "5 ReScript core adapters"
                 "RSR Bronze compliance"
                 "GitHub release"
                 "CI/CD with language policy")))

      ((phase . "1.1.0 - Improvements")
       (status . "in-progress")
       (goals . ("Connection pooling" ;; DONE
                 "Container images (Dockerfile, CI)"  ;; DONE
                 "Better error messages" ;; DONE
                 "Installation docs")))

      ((phase . "2.0.0 - Full ReScript")
       (status . "vision")
       (goals . ("100% ReScript codebase"
                 "RSR Gold compliance"
                 "Type-safe throughout"))))

    (files-modified-this-session
      ("STATE.scm" "README.md" ".gitattributes"
       ".github/workflows/ci.yml" ".githooks/pre-commit"
       "src/Adapter.res" "src/bindings/*" "src/adapters/*"
       "adapters/postgresql.js" "adapters/mongodb.js"
       "adapters/neo4j.js" "adapters/elasticsearch.js"
       "adapters/influxdb.js" "index.js"))

    (context-notes . "v1.0.0 released with 16 databases. 5 core adapters (PostgreSQL, MongoDB, SQLite, Dragonfly, Elasticsearch) converted to ReScript. TypeScript prohibited via CI/CD and git hooks. Full ReScript migration planned for v2.0.0.")))

;;; ==================================================
;;; END STATE.scm
;;; ==================================================
