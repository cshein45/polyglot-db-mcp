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
      (last-updated . "2025-12-13T00:00:00Z"))

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
       (relation . "merged")
       (description . "ArangoDB MCP server")
       (url . "https://github.com/hyperpolymath/arango-mcp")
       (notes . "MERGED 2025-12-13: Now integrated as adapters/arangodb.js"))

      ((name . "virtuoso-mcp")
       (relation . "merged")
       (description . "Virtuoso SPARQL MCP server")
       (url . "https://github.com/hyperpolymath/virtuoso-mcp")
       (notes . "MERGED 2025-12-13: Now integrated as adapters/virtuoso.js"))

      ((name . "Rhodium-Standard-Repositories")
       (relation . "standard")
       (description . "RSR compliance framework")
       (url . "https://github.com/hyperpolymath/Rhodium-Standard-Repositories")
       (notes . "This project follows RSR standards"))

      ((name . "STATE.scm")
       (relation . "tooling")
       (description . "Project state tracking format")
       (url . "https://github.com/hyperpolymath/state.scm")
       (notes . "Source of STATE.scm format"))

      ((name . "polyglot-container-mcp")
       (relation . "sibling")
       (description . "Unified MCP for 3 container runtimes (nerdctl, podman, docker)")
       (url . "https://github.com/hyperpolymath/polyglot-container-mcp")
       (notes . "Same architecture, different domain. Analyzed 2025-12-13: keep separate."))

      ((name . "polyglot-ssg-mcp")
       (relation . "sibling")
       (description . "Unified MCP for 28 static site generators")
       (url . "https://github.com/hyperpolymath/polyglot-ssg-mcp")
       (notes . "Same architecture, different domain. Analyzed 2025-12-13: keep separate.")))

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
       (version . "3.x"))

      ((name . "ArangoDB JS Driver")
       (type . "library")
       (url . "https://github.com/arangodb/arangojs")
       (version . "10.x")))

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
      (uniqueness . "Unified MCP interface to 20 databases"))

    ;;; ==================================================
    ;;; INTEGRATION OPPORTUNITIES
    ;;; ==================================================

    (integration-opportunities
      ("Create n8n workflow templates using this MCP"
       "Add ClickHouse adapter"
       "Add ScyllaDB adapter"))

    ;;; ==================================================
    ;;; COMPLETED INTEGRATIONS
    ;;; ==================================================

    (completed-integrations
      ("arango-mcp merged 2025-12-13"
       "virtuoso-mcp merged 2025-12-13"
       "Neo4j adapter added"
       "InfluxDB adapter added"
       "Polyglot family dedup analysis 2025-12-13: keep db/container/ssg separate"
       "CouchDB adapter added 2025-12-13"
       "Cassandra adapter added 2025-12-13"))

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
