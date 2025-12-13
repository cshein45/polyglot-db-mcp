// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Jonathan D.A. Jewell

/**
 * Cassandra Adapter
 * Apache Cassandra distributed NoSQL database
 */

import cassandra from "cassandra-driver";

let client = null;

const config = {
  contactPoints: (Deno.env.get("CASSANDRA_CONTACT_POINTS") || "localhost").split(","),
  localDataCenter: Deno.env.get("CASSANDRA_DATACENTER") || "datacenter1",
  keyspace: Deno.env.get("CASSANDRA_KEYSPACE") || "",
  username: Deno.env.get("CASSANDRA_USERNAME") || "",
  password: Deno.env.get("CASSANDRA_PASSWORD") || "",
};

export const name = "cassandra";
export const description = "Apache Cassandra distributed NoSQL database";

function getClient() {
  if (!client) {
    const options = {
      contactPoints: config.contactPoints,
      localDataCenter: config.localDataCenter,
    };

    if (config.keyspace) {
      options.keyspace = config.keyspace;
    }

    if (config.username && config.password) {
      options.authProvider = new cassandra.auth.PlainTextAuthProvider(
        config.username,
        config.password
      );
    }

    client = new cassandra.Client(options);
  }
  return client;
}

export async function connect() {
  const c = getClient();
  await c.connect();
  return true;
}

export async function disconnect() {
  if (client) {
    await client.shutdown();
    client = null;
  }
}

export async function isConnected() {
  try {
    const c = getClient();
    await c.execute("SELECT release_version FROM system.local");
    return true;
  } catch {
    return false;
  }
}

export const tools = {
  cassandra_query: {
    description: "Execute a CQL query",
    params: {
      query: { type: "string", description: "CQL query to execute" },
      params: { type: "string", description: "Query parameters as JSON array (optional)" },
      keyspace: { type: "string", description: "Keyspace to use (optional, uses CASSANDRA_KEYSPACE if not provided)" },
    },
    handler: async ({ query, params: queryParams, keyspace }) => {
      const c = getClient();

      const options = {};
      if (keyspace) options.keyspace = keyspace;

      const parsedParams = queryParams ? JSON.parse(queryParams) : [];
      const result = await c.execute(query, parsedParams, options);

      return {
        rowCount: result.rowLength,
        columns: result.columns?.map((col) => ({
          name: col.name,
          type: col.type.code,
        })),
        rows: result.rows?.slice(0, 100) || [],
      };
    },
  },

  cassandra_list_keyspaces: {
    description: "List all keyspaces",
    params: {},
    handler: async () => {
      const c = getClient();
      const result = await c.execute(
        "SELECT keyspace_name, replication FROM system_schema.keyspaces"
      );

      const keyspaces = result.rows.map((row) => ({
        name: row.keyspace_name,
        replication: row.replication,
      }));

      return { count: keyspaces.length, keyspaces };
    },
  },

  cassandra_list_tables: {
    description: "List all tables in a keyspace",
    params: {
      keyspace: { type: "string", description: "Keyspace name (uses CASSANDRA_KEYSPACE if not provided)" },
    },
    handler: async ({ keyspace }) => {
      const ks = keyspace || config.keyspace;
      if (!ks) throw new Error("Keyspace required");

      const c = getClient();
      const result = await c.execute(
        "SELECT table_name FROM system_schema.tables WHERE keyspace_name = ?",
        [ks]
      );

      const tables = result.rows.map((row) => row.table_name);
      return { keyspace: ks, count: tables.length, tables };
    },
  },

  cassandra_describe_table: {
    description: "Get table schema information",
    params: {
      table: { type: "string", description: "Table name" },
      keyspace: { type: "string", description: "Keyspace name (uses CASSANDRA_KEYSPACE if not provided)" },
    },
    handler: async ({ table, keyspace }) => {
      const ks = keyspace || config.keyspace;
      if (!ks) throw new Error("Keyspace required");
      if (!table) throw new Error("Table name required");

      const c = getClient();

      // Get columns
      const colResult = await c.execute(
        `SELECT column_name, type, kind, position
         FROM system_schema.columns
         WHERE keyspace_name = ? AND table_name = ?`,
        [ks, table]
      );

      const columns = colResult.rows.map((row) => ({
        name: row.column_name,
        type: row.type,
        kind: row.kind,
        position: row.position,
      }));

      // Get table metadata
      const tableResult = await c.execute(
        `SELECT bloom_filter_fp_chance, caching, comment, compaction, compression
         FROM system_schema.tables
         WHERE keyspace_name = ? AND table_name = ?`,
        [ks, table]
      );

      const metadata = tableResult.rows[0] || {};

      return {
        keyspace: ks,
        table,
        columns,
        metadata: {
          bloomFilterFpChance: metadata.bloom_filter_fp_chance,
          caching: metadata.caching,
          comment: metadata.comment,
          compaction: metadata.compaction,
          compression: metadata.compression,
        },
      };
    },
  },

  cassandra_insert: {
    description: "Insert a row into a table",
    params: {
      table: { type: "string", description: "Table name" },
      data: { type: "string", description: "Row data as JSON object" },
      keyspace: { type: "string", description: "Keyspace name (uses CASSANDRA_KEYSPACE if not provided)" },
      ttl: { type: "string", description: "Time-to-live in seconds (optional)" },
    },
    handler: async ({ table, data, keyspace, ttl }) => {
      const ks = keyspace || config.keyspace;
      if (!ks) throw new Error("Keyspace required");
      if (!table) throw new Error("Table name required");
      if (!data) throw new Error("Data required");

      const rowData = JSON.parse(data);
      const columns = Object.keys(rowData);
      const values = Object.values(rowData);
      const placeholders = columns.map(() => "?").join(", ");

      let query = `INSERT INTO ${ks}.${table} (${columns.join(", ")}) VALUES (${placeholders})`;
      if (ttl) query += ` USING TTL ${parseInt(ttl, 10)}`;

      const c = getClient();
      await c.execute(query, values, { prepare: true });

      return { success: true, table: `${ks}.${table}`, columns };
    },
  },

  cassandra_update: {
    description: "Update rows in a table",
    params: {
      table: { type: "string", description: "Table name" },
      set: { type: "string", description: "Values to set as JSON object" },
      where: { type: "string", description: "WHERE clause conditions as JSON object" },
      keyspace: { type: "string", description: "Keyspace name (uses CASSANDRA_KEYSPACE if not provided)" },
    },
    handler: async ({ table, set, where, keyspace }) => {
      const ks = keyspace || config.keyspace;
      if (!ks) throw new Error("Keyspace required");
      if (!table) throw new Error("Table name required");
      if (!set) throw new Error("Set values required");
      if (!where) throw new Error("Where conditions required");

      const setData = JSON.parse(set);
      const whereData = JSON.parse(where);

      const setClauses = Object.keys(setData).map((col) => `${col} = ?`);
      const whereClauses = Object.keys(whereData).map((col) => `${col} = ?`);
      const values = [...Object.values(setData), ...Object.values(whereData)];

      const query = `UPDATE ${ks}.${table} SET ${setClauses.join(", ")} WHERE ${whereClauses.join(" AND ")}`;

      const c = getClient();
      await c.execute(query, values, { prepare: true });

      return { success: true, table: `${ks}.${table}` };
    },
  },

  cassandra_delete: {
    description: "Delete rows from a table",
    params: {
      table: { type: "string", description: "Table name" },
      where: { type: "string", description: "WHERE clause conditions as JSON object" },
      keyspace: { type: "string", description: "Keyspace name (uses CASSANDRA_KEYSPACE if not provided)" },
    },
    handler: async ({ table, where, keyspace }) => {
      const ks = keyspace || config.keyspace;
      if (!ks) throw new Error("Keyspace required");
      if (!table) throw new Error("Table name required");
      if (!where) throw new Error("Where conditions required");

      const whereData = JSON.parse(where);
      const whereClauses = Object.keys(whereData).map((col) => `${col} = ?`);
      const values = Object.values(whereData);

      const query = `DELETE FROM ${ks}.${table} WHERE ${whereClauses.join(" AND ")}`;

      const c = getClient();
      await c.execute(query, values, { prepare: true });

      return { success: true, table: `${ks}.${table}` };
    },
  },

  cassandra_create_keyspace: {
    description: "Create a new keyspace",
    params: {
      name: { type: "string", description: "Keyspace name" },
      replication_factor: { type: "string", description: "Replication factor (default: 1)" },
      strategy: { type: "string", description: "Replication strategy: SimpleStrategy or NetworkTopologyStrategy (default: SimpleStrategy)" },
    },
    handler: async ({ name, replication_factor, strategy }) => {
      if (!name) throw new Error("Keyspace name required");

      const rf = replication_factor ? parseInt(replication_factor, 10) : 1;
      const strat = strategy || "SimpleStrategy";

      let replication;
      if (strat === "SimpleStrategy") {
        replication = `{'class': 'SimpleStrategy', 'replication_factor': ${rf}}`;
      } else {
        replication = `{'class': 'NetworkTopologyStrategy', '${config.localDataCenter}': ${rf}}`;
      }

      const query = `CREATE KEYSPACE IF NOT EXISTS ${name} WITH replication = ${replication}`;

      const c = getClient();
      await c.execute(query);

      return { success: true, keyspace: name, strategy: strat, replicationFactor: rf };
    },
  },

  cassandra_create_table: {
    description: "Create a new table",
    params: {
      table: { type: "string", description: "Table name" },
      columns: { type: "string", description: "Column definitions as JSON object (e.g., '{\"id\": \"uuid\", \"name\": \"text\"}')" },
      primary_key: { type: "string", description: "Primary key column(s) - single column or JSON array for composite" },
      keyspace: { type: "string", description: "Keyspace name (uses CASSANDRA_KEYSPACE if not provided)" },
    },
    handler: async ({ table, columns, primary_key, keyspace }) => {
      const ks = keyspace || config.keyspace;
      if (!ks) throw new Error("Keyspace required");
      if (!table) throw new Error("Table name required");
      if (!columns) throw new Error("Columns required");
      if (!primary_key) throw new Error("Primary key required");

      const colDefs = JSON.parse(columns);
      const columnDefs = Object.entries(colDefs)
        .map(([name, type]) => `${name} ${type}`)
        .join(", ");

      let pk;
      try {
        const pkArray = JSON.parse(primary_key);
        pk = `(${pkArray.join(", ")})`;
      } catch {
        pk = primary_key;
      }

      const query = `CREATE TABLE IF NOT EXISTS ${ks}.${table} (${columnDefs}, PRIMARY KEY (${pk}))`;

      const c = getClient();
      await c.execute(query);

      return { success: true, table: `${ks}.${table}` };
    },
  },

  cassandra_drop_table: {
    description: "Drop a table",
    params: {
      table: { type: "string", description: "Table name" },
      keyspace: { type: "string", description: "Keyspace name (uses CASSANDRA_KEYSPACE if not provided)" },
    },
    handler: async ({ table, keyspace }) => {
      const ks = keyspace || config.keyspace;
      if (!ks) throw new Error("Keyspace required");
      if (!table) throw new Error("Table name required");

      const query = `DROP TABLE IF EXISTS ${ks}.${table}`;

      const c = getClient();
      await c.execute(query);

      return { success: true, table: `${ks}.${table}`, dropped: true };
    },
  },

  cassandra_batch: {
    description: "Execute multiple statements in a batch",
    params: {
      statements: { type: "string", description: "Array of CQL statements as JSON" },
      keyspace: { type: "string", description: "Keyspace name (uses CASSANDRA_KEYSPACE if not provided)" },
    },
    handler: async ({ statements, keyspace }) => {
      if (!statements) throw new Error("Statements required");

      const stmts = JSON.parse(statements);
      const queries = stmts.map((stmt) => {
        if (typeof stmt === "string") {
          return { query: stmt };
        }
        return { query: stmt.query, params: stmt.params };
      });

      const c = getClient();
      const options = {};
      if (keyspace) options.keyspace = keyspace;

      await c.batch(queries, options);

      return { success: true, statementCount: queries.length };
    },
  },

  cassandra_cluster_info: {
    description: "Get cluster information",
    params: {},
    handler: async () => {
      const c = getClient();

      // Get local node info
      const localResult = await c.execute(
        "SELECT cluster_name, release_version, data_center, rack FROM system.local"
      );
      const local = localResult.rows[0];

      // Get peers info
      const peersResult = await c.execute(
        "SELECT peer, data_center, rack, release_version FROM system.peers"
      );

      return {
        cluster: local.cluster_name,
        version: local.release_version,
        localDataCenter: local.data_center,
        localRack: local.rack,
        peers: peersResult.rows.map((row) => ({
          peer: row.peer,
          dataCenter: row.data_center,
          rack: row.rack,
          version: row.release_version,
        })),
        totalNodes: 1 + peersResult.rowLength,
      };
    },
  },
};
