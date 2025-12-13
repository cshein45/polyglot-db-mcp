# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2025-12-13

### Added

- **ArangoDB adapter** (13 tools) - Multi-model database with document, graph, and key-value support
  - `arango_query` - Execute AQL queries
  - `arango_list_databases`, `arango_list_collections`, `arango_collection_info`
  - `arango_insert`, `arango_get`, `arango_update`, `arango_delete`
  - `arango_create_collection`, `arango_create_index`
  - `arango_traverse`, `arango_list_graphs`, `arango_explain`

- **Virtuoso adapter** (14 tools) - RDF triplestore with SPARQL support
  - `virtuoso_select`, `virtuoso_ask`, `virtuoso_construct`, `virtuoso_describe`
  - `virtuoso_insert`, `virtuoso_delete`, `virtuoso_update`
  - `virtuoso_list_graphs`, `virtuoso_graph_stats`
  - `virtuoso_find_by_type`, `virtuoso_text_search`, `virtuoso_list_prefixes`
  - `virtuoso_load_rdf`, `virtuoso_clear_graph`

- **CouchDB adapter** (13 tools) - Document database with HTTP REST API
  - `couchdb_list_databases`, `couchdb_create_database`, `couchdb_delete_database`
  - `couchdb_info`, `couchdb_all_docs`
  - `couchdb_get`, `couchdb_insert`, `couchdb_delete`
  - `couchdb_find`, `couchdb_create_index`, `couchdb_view`
  - `couchdb_bulk_docs`, `couchdb_changes`

- **Cassandra adapter** (12 tools) - Distributed wide-column store
  - `cassandra_query` - Execute CQL queries
  - `cassandra_list_keyspaces`, `cassandra_list_tables`, `cassandra_describe_table`
  - `cassandra_insert`, `cassandra_update`, `cassandra_delete`
  - `cassandra_create_keyspace`, `cassandra_create_table`, `cassandra_drop_table`
  - `cassandra_batch`, `cassandra_cluster_info`

### Changed

- Total supported databases increased from 16 to 20

### Merged

- Standalone `arango-mcp` repository merged into this project
- Standalone `virtuoso-mcp` repository merged into this project

## [1.1.0] - 2025-12-12

### Added

- Error feedback URLs in tool responses
- AI.scm file for AI assistant instructions
- Directory syndication support

### Changed

- Improved error messages with actionable feedback

## [1.0.0] - 2025-12-10

### Added

- Initial release with 16 database adapters
- PostgreSQL, MongoDB, Neo4j, Elasticsearch adapters
- Redis/Dragonfly, Memcached, LMDB cache adapters
- SQLite, DuckDB, MariaDB relational adapters
- SurrealDB, XTDB specialized adapters
- Qdrant vector database adapter
- Meilisearch full-text search adapter
- InfluxDB time-series adapter
- iTop CMDB adapter
- Unified meta tools: `db_list`, `db_status`, `db_help`
- Cross-database `db_copy` tool (placeholder)

[1.2.0]: https://github.com/hyperpolymath/polyglot-db-mcp/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/hyperpolymath/polyglot-db-mcp/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/hyperpolymath/polyglot-db-mcp/releases/tag/v1.0.0
