;;; ==================================================
;;; ECOSYSTEM.scm — Project Relationships & Associations
;;; ==================================================
;;;
;;; SPDX-License-Identifier: MIT
;;; Copyright (c) 2025 Jonathan D.A. Jewell
;;;
;;; This project's place in the broader ecosystem
;;; and its relationships with other projects.
;;;
;;; ==================================================

(define ecosystem
  '((metadata
      (format-version . "1.0")
      (created-at . "2025-12-12T00:00:00Z")
      (last-updated . "2025-12-12T00:00:00Z"))

    ;;; ==================================================
    ;;; PROJECT IDENTITY
    ;;; ==================================================

    (identity
      (name . "polyglot-db-mcp")
      (category . "MCP Server")
      (domain . "Database Access")
      (maintainer . "hyperpolymath"))

    ;;; ==================================================
    ;;; SIBLING PROJECTS (Same maintainer)
    ;;; ==================================================

    (siblings
      ((name . "arango-mcp")
       (relation . "similar")
       (description . "ArangoDB MCP server")
       (url . "https://github.com/hyperpolymath/arango-mcp")
       (notes . "Standalone ArangoDB adapter, could be merged"))

      ((name . "virtuoso-mcp")
       (relation . "similar")
       (description . "Virtuoso SPARQL MCP server")
       (url . "https://github.com/hyperpolymath/virtuoso-mcp")
       (notes . "SPARQL/RDF triplestore adapter"))

      ((name . "Rhodium-Standard-Repositories")
       (relation . "standard")
       (description . "RSR compliance framework")
       (url . "https://github.com/hyperpolymath/Rhodium-Standard-Repositories")
       (notes . "This project follows RSR standards"))

      ((name . "STATE.scm")
       (relation . "tooling")
       (description . "Project state tracking format")
       (url . "https://github.com/hyperpolymath/state.scm")
       (notes . "Source of STATE.scm format")))

    ;;; ==================================================
    ;;; UPSTREAM DEPENDENCIES
    ;;; ==================================================

    (upstream
      ((name . "MCP SDK")
       (type . "protocol")
       (url . "https://github.com/modelcontextprotocol/sdk")
       (version . "1.24.3")
       (critical . #t))

      ((name . "Deno")
       (type . "runtime")
       (url . "https://deno.land")
       (version . "1.45+")
       (critical . #t))

      ((name . "SurrealDB Client")
       (type . "library")
       (url . "https://github.com/surrealdb/surrealdb.js")
       (version . "1.x"))

      ((name . "ioredis")
       (type . "library")
       (url . "https://github.com/redis/ioredis")
       (version . "5.x"))

      ((name . "Qdrant JS Client")
       (type . "library")
       (url . "https://github.com/qdrant/qdrant-js")
       (version . "1.x"))

      ((name . "Meilisearch JS")
       (type . "library")
       (url . "https://github.com/meilisearch/meilisearch-js")
       (version . "0.44.x"))

      ((name . "MariaDB Connector")
       (type . "library")
       (url . "https://github.com/mariadb-corporation/mariadb-connector-nodejs")
       (version . "3.x")))

    ;;; ==================================================
    ;;; DOWNSTREAM CONSUMERS
    ;;; ==================================================

    (downstream
      ((name . "Claude Code")
       (type . "client")
       (description . "Primary consumer via MCP protocol")
       (notes . "Registered as polyglot-db MCP server")))

    ;;; ==================================================
    ;;; ECOSYSTEM POSITION
    ;;; ==================================================

    (position
      (layer . "infrastructure")
      (role . "database-abstraction")
      (scope . "multi-database")
      (uniqueness . "Unified MCP interface to 11+ databases"))

    ;;; ==================================================
    ;;; INTEGRATION OPPORTUNITIES
    ;;; ==================================================

    (integration-opportunities
      ("Merge arango-mcp and virtuoso-mcp into this project"
       "Add CouchDB adapter"
       "Add Neo4j adapter"
       "Add InfluxDB adapter for time series"
       "Add Cassandra adapter"
       "Create n8n workflow templates using this MCP"))

    ;;; ==================================================
    ;;; STANDARDS & COMPLIANCE
    ;;; ==================================================

    (standards
      ((name . "RSR")
       (level . "Bronze")
       (url . "https://github.com/hyperpolymath/Rhodium-Standard-Repositories"))

      ((name . "MCP")
       (version . "1.x")
       (url . "https://modelcontextprotocol.io"))

      ((name . "Dublin Core")
       (status . "implemented")
       (location . "STATE.scm")))

    (context-notes . "This project bridges AI assistants to multiple database systems via MCP.")))

;;; ==================================================
;;; END ECOSYSTEM.scm
;;; ==================================================
