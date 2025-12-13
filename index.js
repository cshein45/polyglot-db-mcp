#!/usr/bin/env -S deno run --allow-net --allow-read --allow-write --allow-env
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Jonathan D.A. Jewell

/**
 * Polyglot DB MCP Server
 * Unified interface to multiple databases
 *
 * Run: deno task start
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// Import all adapters
import * as surrealdb from "./adapters/surrealdb.js";
import * as dragonfly from "./adapters/dragonfly.js";
import * as xtdb from "./adapters/xtdb.js";
import * as sqlite from "./adapters/sqlite.js";
import * as duckdb from "./adapters/duckdb.js";
import * as qdrant from "./adapters/qdrant.js";
import * as meilisearch from "./adapters/meilisearch.js";
import * as mariadb from "./adapters/mariadb.js";
import * as memcached from "./adapters/memcached.js";
import * as lmdb from "./adapters/lmdb.js";
import * as itop from "./adapters/itop.js";
import * as postgresql from "./adapters/postgresql.js";
import * as mongodb from "./adapters/mongodb.js";
import * as neo4j from "./adapters/neo4j.js";
import * as elasticsearch from "./adapters/elasticsearch.js";
import * as influxdb from "./adapters/influxdb.js";
import * as arangodb from "./adapters/arangodb.js";
import * as virtuoso from "./adapters/virtuoso.js";
import * as couchdb from "./adapters/couchdb.js";
import * as cassandra from "./adapters/cassandra.js";

// Registry of all adapters
const adapters = {
  surrealdb,
  dragonfly,
  xtdb,
  sqlite,
  duckdb,
  qdrant,
  meilisearch,
  mariadb,
  memcached,
  lmdb,
  itop,
  postgresql,
  mongodb,
  neo4j,
  elasticsearch,
  influxdb,
  arangodb,
  virtuoso,
  couchdb,
  cassandra,
};

const server = new McpServer({
  name: "polyglot-db-mcp",
  version: "1.1.0",
});

// =============================================================================
// UNIFIED TOOLS - Work across all databases
// =============================================================================

server.tool(
  "db_list",
  {
    checkConnections: {
      type: "boolean",
      description: "Check which databases are actually connected (slower)",
    },
  },
  async ({ checkConnections = false }) => {
    const databases = [];

    for (const [name, adapter] of Object.entries(adapters)) {
      const db = {
        name,
        description: adapter.description,
        tools: Object.keys(adapter.tools || {}),
      };

      if (checkConnections) {
        try {
          db.connected = await adapter.isConnected();
        } catch {
          db.connected = false;
        }
      }

      databases.push(db);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ databases, total: databases.length }, null, 2),
        },
      ],
    };
  }
);

server.tool(
  "db_help",
  {
    database: {
      type: "string",
      description: "Database name to get help for (optional, shows all if omitted)",
    },
  },
  async ({ database }) => {
    if (database) {
      const adapter = adapters[database];
      if (!adapter) {
        return {
          content: [
            {
              type: "text",
              text: `Unknown database: ${database}. Use db_list to see available databases.`,
            },
          ],
        };
      }

      const tools = Object.entries(adapter.tools || {}).map(([name, tool]) => ({
        name,
        description: tool.description,
        params: Object.entries(tool.params || {}).map(([pname, pdef]) => ({
          name: pname,
          ...pdef,
        })),
      }));

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                database,
                description: adapter.description,
                tools,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    // Show summary of all databases
    const summary = Object.entries(adapters).map(([name, adapter]) => ({
      name,
      description: adapter.description,
      toolCount: Object.keys(adapter.tools || {}).length,
    }));

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ databases: summary }, null, 2),
        },
      ],
    };
  }
);

server.tool(
  "db_status",
  {},
  async () => {
    const status = {};

    for (const [name, adapter] of Object.entries(adapters)) {
      try {
        status[name] = await adapter.isConnected();
      } catch {
        status[name] = false;
      }
    }

    const connected = Object.entries(status)
      .filter(([, v]) => v)
      .map(([k]) => k);
    const disconnected = Object.entries(status)
      .filter(([, v]) => !v)
      .map(([k]) => k);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              connected,
              disconnected,
              summary: `${connected.length}/${Object.keys(status).length} databases connected`,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// =============================================================================
// REGISTER ALL ADAPTER TOOLS
// =============================================================================

for (const [adapterName, adapter] of Object.entries(adapters)) {
  for (const [toolName, toolDef] of Object.entries(adapter.tools || {})) {
    // Convert params to the format expected by MCP
    const params = {};
    for (const [paramName, paramDef] of Object.entries(toolDef.params || {})) {
      params[paramName] = paramDef;
    }

    server.tool(toolName, params, async (args) => {
      try {
        const result = await toolDef.handler(args);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const feedbackUrl = `https://github.com/hyperpolymath/polyglot-db-mcp/issues/new?title=${encodeURIComponent(`[BUG] ${toolName}: ${error.message.substring(0, 50)}`)}&labels=bug&body=${encodeURIComponent(`## Error Details\n- **Tool**: ${toolName}\n- **Adapter**: ${adapterName}\n- **Error**: ${error.message}\n\n## Environment\n- OS: \n- Deno version: \n\n## Steps to Reproduce\n1. \n\n## Additional Context\n`)}`;
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: error.message,
                tool: toolName,
                adapter: adapterName,
                feedback: {
                  message: "🐛 Found a bug? This is early development - your feedback helps!",
                  reportUrl: feedbackUrl,
                },
              }, null, 2),
            },
          ],
        };
      }
    });
  }
}

// =============================================================================
// CROSS-DATABASE TOOLS
// =============================================================================

server.tool(
  "db_copy",
  {
    from_db: { type: "string", description: "Source database name" },
    from_query: { type: "string", description: "Query to get source data (db-specific)" },
    to_db: { type: "string", description: "Target database name" },
    to_target: { type: "string", description: "Target location (table/collection/key prefix)" },
    transform: { type: "string", description: "JS transform function as string (optional)" },
  },
  async ({ from_db, from_query, to_db, to_target, transform }) => {
    // This is a simplified cross-DB copy - real implementation would be more complex
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            message: "Cross-database copy requires specific implementation per DB pair",
            hint: "Use the individual query and insert tools for now",
            from: from_db,
            to: to_db,
          }, null, 2),
        },
      ],
    };
  }
);

// =============================================================================
// START SERVER
// =============================================================================

const transport = new StdioServerTransport();
await server.connect(transport);
