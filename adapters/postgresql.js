// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Jonathan D.A. Jewell

/**
 * PostgreSQL Adapter
 * Full-featured relational database with JSON, arrays, extensions
 */

import postgres from "npm:postgres@3.4.4";

let sql = null;

const config = {
  host: Deno.env.get("POSTGRES_HOST") || "localhost",
  port: parseInt(Deno.env.get("POSTGRES_PORT") || "5432"),
  database: Deno.env.get("POSTGRES_DATABASE") || "postgres",
  username: Deno.env.get("POSTGRES_USER") || "postgres",
  password: Deno.env.get("POSTGRES_PASSWORD") || "",
  // Pool configuration
  max: parseInt(Deno.env.get("POSTGRES_POOL_MAX") || "10"),
  idle_timeout: parseInt(Deno.env.get("POSTGRES_IDLE_TIMEOUT") || "30"),
  connect_timeout: parseInt(Deno.env.get("POSTGRES_CONNECT_TIMEOUT") || "10"),
};

export async function connect() {
  if (sql) return sql;
  try {
    sql = postgres({
      host: config.host,
      port: config.port,
      database: config.database,
      username: config.username,
      password: config.password,
      max: config.max,
      idle_timeout: config.idle_timeout,
      connect_timeout: config.connect_timeout,
      onnotice: () => {}, // Suppress notices
    });
    return sql;
  } catch (error) {
    throw new Error(`PostgreSQL connection failed: ${error.message}. Check POSTGRES_HOST, POSTGRES_PORT, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DATABASE.`);
  }
}

export async function disconnect() {
  if (sql) {
    await sql.end();
    sql = null;
  }
}

export async function isConnected() {
  try {
    const conn = await connect();
    await conn`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

export const name = "postgresql";
export const description = "PostgreSQL - Advanced open source relational database";

export const tools = {
  pg_query: {
    description: "Execute a SQL query",
    params: {
      query: { type: "string", description: "SQL query to execute" },
    },
    handler: async ({ query }) => {
      const conn = await connect();
      const result = await conn.unsafe(query);
      return { rows: result, count: result.length };
    },
  },

  pg_select: {
    description: "Select rows from a table",
    params: {
      table: { type: "string", description: "Table name" },
      columns: { type: "string", description: "Columns to select (default: *)" },
      where: { type: "string", description: "WHERE clause (optional)" },
      orderBy: { type: "string", description: "ORDER BY clause (optional)" },
      limit: { type: "number", description: "Max rows (default 100)" },
    },
    handler: async ({ table, columns = "*", where, orderBy, limit = 100 }) => {
      const conn = await connect();
      let query = `SELECT ${columns} FROM ${table}`;
      if (where) query += ` WHERE ${where}`;
      if (orderBy) query += ` ORDER BY ${orderBy}`;
      query += ` LIMIT ${limit}`;
      const result = await conn.unsafe(query);
      return { rows: result, count: result.length };
    },
  },

  pg_insert: {
    description: "Insert a row into a table",
    params: {
      table: { type: "string", description: "Table name" },
      data: { type: "string", description: "JSON object of column: value pairs" },
      returning: { type: "string", description: "Columns to return (optional)" },
    },
    handler: async ({ table, data, returning }) => {
      const conn = await connect();
      const obj = JSON.parse(data);
      const columns = Object.keys(obj).join(", ");
      const values = Object.values(obj)
        .map((v) => (typeof v === "string" ? `'${v}'` : v))
        .join(", ");
      let query = `INSERT INTO ${table} (${columns}) VALUES (${values})`;
      if (returning) query += ` RETURNING ${returning}`;
      const result = await conn.unsafe(query);
      return { inserted: true, result };
    },
  },

  pg_update: {
    description: "Update rows in a table",
    params: {
      table: { type: "string", description: "Table name" },
      data: { type: "string", description: "JSON object of column: value pairs to update" },
      where: { type: "string", description: "WHERE clause (required for safety)" },
    },
    handler: async ({ table, data, where }) => {
      if (!where) throw new Error("WHERE clause required for UPDATE");
      const conn = await connect();
      const obj = JSON.parse(data);
      const sets = Object.entries(obj)
        .map(([k, v]) => `${k} = ${typeof v === "string" ? `'${v}'` : v}`)
        .join(", ");
      const query = `UPDATE ${table} SET ${sets} WHERE ${where}`;
      const result = await conn.unsafe(query);
      return { updated: true, count: result.count };
    },
  },

  pg_delete: {
    description: "Delete rows from a table",
    params: {
      table: { type: "string", description: "Table name" },
      where: { type: "string", description: "WHERE clause (required for safety)" },
    },
    handler: async ({ table, where }) => {
      if (!where) throw new Error("WHERE clause required for DELETE");
      const conn = await connect();
      const result = await conn.unsafe(`DELETE FROM ${table} WHERE ${where}`);
      return { deleted: true, count: result.count };
    },
  },

  pg_tables: {
    description: "List all tables in the database",
    params: {
      schema: { type: "string", description: "Schema name (default: public)" },
    },
    handler: async ({ schema = "public" }) => {
      const conn = await connect();
      const result = await conn`
        SELECT table_name, table_type
        FROM information_schema.tables
        WHERE table_schema = ${schema}
        ORDER BY table_name
      `;
      return { tables: result, count: result.length };
    },
  },

  pg_columns: {
    description: "Get column information for a table",
    params: {
      table: { type: "string", description: "Table name" },
      schema: { type: "string", description: "Schema name (default: public)" },
    },
    handler: async ({ table, schema = "public" }) => {
      const conn = await connect();
      const result = await conn`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = ${schema} AND table_name = ${table}
        ORDER BY ordinal_position
      `;
      return { columns: result };
    },
  },

  pg_json_query: {
    description: "Query JSONB columns with PostgreSQL JSON operators",
    params: {
      table: { type: "string", description: "Table name" },
      jsonColumn: { type: "string", description: "JSONB column name" },
      path: { type: "string", description: "JSON path (e.g., 'address.city')" },
      value: { type: "string", description: "Value to match (optional)" },
      limit: { type: "number", description: "Max rows (default 100)" },
    },
    handler: async ({ table, jsonColumn, path, value, limit = 100 }) => {
      const conn = await connect();
      const pathParts = path.split(".");
      const jsonPath = pathParts.map((p) => `'${p}'`).join("->");
      let query = `SELECT * FROM ${table} WHERE ${jsonColumn}->${jsonPath.slice(0, -1)}->>${pathParts[pathParts.length - 1]}`;
      if (value) {
        query = `SELECT * FROM ${table} WHERE ${jsonColumn}->>${pathParts.map((p) => `'${p}'`).join("->")} = '${value}'`;
      } else {
        query = `SELECT *, ${jsonColumn}->'${path.replace(".", "'->'")}'::text as extracted FROM ${table}`;
      }
      query += ` LIMIT ${limit}`;
      const result = await conn.unsafe(query);
      return { rows: result, count: result.length };
    },
  },

  pg_create_table: {
    description: "Create a new table",
    params: {
      table: { type: "string", description: "Table name" },
      columns: { type: "string", description: "Column definitions as JSON array [{name, type, constraints}]" },
    },
    handler: async ({ table, columns }) => {
      const conn = await connect();
      const cols = JSON.parse(columns);
      const colDefs = cols
        .map((c) => `${c.name} ${c.type}${c.constraints ? " " + c.constraints : ""}`)
        .join(", ");
      await conn.unsafe(`CREATE TABLE ${table} (${colDefs})`);
      return { created: true, table };
    },
  },

  pg_extensions: {
    description: "List installed PostgreSQL extensions",
    params: {},
    handler: async () => {
      const conn = await connect();
      const result = await conn`SELECT extname, extversion FROM pg_extension ORDER BY extname`;
      return { extensions: result };
    },
  },
};
