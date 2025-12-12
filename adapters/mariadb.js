// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Jonathan D.A. Jewell

/**
 * MariaDB Adapter
 * MySQL-compatible relational database
 */

import mariadb from "npm:mariadb@3";

let pool = null;

const config = {
  host: Deno.env.get("MARIADB_HOST") || "localhost",
  port: parseInt(Deno.env.get("MARIADB_PORT") || "3306"),
  user: Deno.env.get("MARIADB_USER") || "root",
  password: Deno.env.get("MARIADB_PASSWORD") || "",
  database: Deno.env.get("MARIADB_DATABASE") || undefined,
  // Pool configuration
  connectionLimit: parseInt(Deno.env.get("MARIADB_POOL_MAX") || "10"),
  acquireTimeout: parseInt(Deno.env.get("MARIADB_ACQUIRE_TIMEOUT") || "10000"),
  idleTimeout: parseInt(Deno.env.get("MARIADB_IDLE_TIMEOUT") || "30000"),
  connectTimeout: parseInt(Deno.env.get("MARIADB_CONNECT_TIMEOUT") || "10000"),
};

export async function connect() {
  if (pool) return pool;
  try {
    pool = mariadb.createPool(config);
    // Test connection
    const conn = await pool.getConnection();
    conn.release();
    return pool;
  } catch (error) {
    pool = null;
    throw new Error(`MariaDB connection failed: ${error.message}. Check MARIADB_HOST, MARIADB_PORT, MARIADB_USER, MARIADB_PASSWORD, MARIADB_DATABASE.`);
  }
}

export async function disconnect() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export async function isConnected() {
  try {
    const conn = await connect();
    const connection = await conn.getConnection();
    await connection.ping();
    connection.release();
    return true;
  } catch {
    return false;
  }
}

export const name = "mariadb";
export const description = "MySQL-compatible relational database";

export const tools = {
  maria_query: {
    description: "Execute a SELECT query",
    params: {
      sql: { type: "string", description: "SQL SELECT query" },
      params: { type: "string", description: "Query parameters as JSON array (optional)" },
    },
    handler: async ({ sql, params }) => {
      const conn = await connect();
      const parameters = params ? JSON.parse(params) : [];
      const rows = await conn.query(sql, parameters);
      // Remove meta property
      const results = Array.isArray(rows) ? rows.filter((r) => !r.meta) : rows;
      return { count: results.length, rows: results };
    },
  },

  maria_exec: {
    description: "Execute a SQL statement (INSERT, UPDATE, DELETE, etc.)",
    params: {
      sql: { type: "string", description: "SQL statement" },
      params: { type: "string", description: "Statement parameters as JSON array (optional)" },
    },
    handler: async ({ sql, params }) => {
      const conn = await connect();
      const parameters = params ? JSON.parse(params) : [];
      const result = await conn.query(sql, parameters);
      return {
        affectedRows: result.affectedRows,
        insertId: result.insertId?.toString(),
        warningStatus: result.warningStatus,
      };
    },
  },

  maria_databases: {
    description: "List all databases",
    params: {},
    handler: async () => {
      const conn = await connect();
      const rows = await conn.query("SHOW DATABASES");
      return { databases: rows.map((r) => r.Database) };
    },
  },

  maria_tables: {
    description: "List all tables in a database",
    params: {
      database: { type: "string", description: "Database name (optional, uses current)" },
    },
    handler: async ({ database }) => {
      const conn = await connect();
      const sql = database ? `SHOW TABLES FROM ${database}` : "SHOW TABLES";
      const rows = await conn.query(sql);
      const key = Object.keys(rows[0] || {})[0];
      return { tables: rows.map((r) => r[key]) };
    },
  },

  maria_describe: {
    description: "Describe a table structure",
    params: {
      table: { type: "string", description: "Table name" },
    },
    handler: async ({ table }) => {
      const conn = await connect();
      const columns = await conn.query(`DESCRIBE ${table}`);
      return { columns };
    },
  },

  maria_insert: {
    description: "Insert a row into a table",
    params: {
      table: { type: "string", description: "Table name" },
      data: { type: "string", description: "Row data as JSON object" },
    },
    handler: async ({ table, data }) => {
      const conn = await connect();
      const row = JSON.parse(data);
      const columns = Object.keys(row);
      const values = Object.values(row);
      const placeholders = columns.map(() => "?").join(", ");

      const sql = `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`;
      const result = await conn.query(sql, values);

      return {
        inserted: true,
        insertId: result.insertId?.toString(),
        affectedRows: result.affectedRows,
      };
    },
  },

  maria_update: {
    description: "Update rows in a table",
    params: {
      table: { type: "string", description: "Table name" },
      data: { type: "string", description: "Update data as JSON object" },
      where: { type: "string", description: "WHERE clause (without 'WHERE')" },
      whereParams: { type: "string", description: "WHERE parameters as JSON array (optional)" },
    },
    handler: async ({ table, data, where, whereParams }) => {
      const conn = await connect();
      const row = JSON.parse(data);
      const wParams = whereParams ? JSON.parse(whereParams) : [];

      const setClause = Object.keys(row)
        .map((k) => `${k} = ?`)
        .join(", ");
      const values = [...Object.values(row), ...wParams];

      const sql = `UPDATE ${table} SET ${setClause} WHERE ${where}`;
      const result = await conn.query(sql, values);

      return { affectedRows: result.affectedRows };
    },
  },

  maria_delete: {
    description: "Delete rows from a table",
    params: {
      table: { type: "string", description: "Table name" },
      where: { type: "string", description: "WHERE clause (without 'WHERE')" },
      whereParams: { type: "string", description: "WHERE parameters as JSON array (optional)" },
    },
    handler: async ({ table, where, whereParams }) => {
      const conn = await connect();
      const params = whereParams ? JSON.parse(whereParams) : [];
      const sql = `DELETE FROM ${table} WHERE ${where}`;
      const result = await conn.query(sql, params);
      return { affectedRows: result.affectedRows };
    },
  },

  maria_transaction: {
    description: "Execute multiple statements in a transaction",
    params: {
      statements: { type: "string", description: "JSON array of {sql, params} objects" },
    },
    handler: async ({ statements }) => {
      const pool = await connect();
      const conn = await pool.getConnection();
      const stmts = JSON.parse(statements);

      try {
        await conn.beginTransaction();
        const results = [];

        for (const { sql, params = [] } of stmts) {
          const result = await conn.query(sql, params);
          results.push({ sql, result: Array.isArray(result) ? result : { affectedRows: result.affectedRows } });
        }

        await conn.commit();
        return { success: true, results };
      } catch (error) {
        await conn.rollback();
        throw error;
      } finally {
        conn.release();
      }
    },
  },

  maria_use: {
    description: "Switch to a different database",
    params: {
      database: { type: "string", description: "Database name" },
    },
    handler: async ({ database }) => {
      const conn = await connect();
      await conn.query(`USE ${database}`);
      return { using: database };
    },
  },

  maria_status: {
    description: "Get server status",
    params: {},
    handler: async () => {
      const conn = await connect();
      const [status] = await conn.query("SHOW STATUS WHERE Variable_name IN ('Uptime', 'Threads_connected', 'Questions', 'Slow_queries')");
      const [version] = await conn.query("SELECT VERSION() as version");
      return { version: version?.version, status };
    },
  },
};
