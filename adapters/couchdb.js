// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Jonathan D.A. Jewell

/**
 * CouchDB Adapter
 * Apache CouchDB document database with HTTP REST API
 */

let connected = false;

const config = {
  url: Deno.env.get("COUCHDB_URL") || "http://localhost:5984",
  username: Deno.env.get("COUCHDB_USERNAME") || "",
  password: Deno.env.get("COUCHDB_PASSWORD") || "",
  database: Deno.env.get("COUCHDB_DATABASE") || "",
};

export const name = "couchdb";
export const description = "Apache CouchDB document database";

function getAuthHeader() {
  if (config.username && config.password) {
    const credentials = btoa(`${config.username}:${config.password}`);
    return { Authorization: `Basic ${credentials}` };
  }
  return {};
}

async function couchRequest(path, options = {}) {
  const url = `${config.url}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...getAuthHeader(),
      ...options.headers,
    },
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  if (!response.ok) {
    const error = data?.reason || data?.error || text || response.statusText;
    throw new Error(`CouchDB error: ${error}`);
  }

  return data;
}

export async function connect() {
  connected = true;
  return true;
}

export async function disconnect() {
  connected = false;
}

export async function isConnected() {
  try {
    await couchRequest("/");
    connected = true;
    return true;
  } catch {
    connected = false;
    return false;
  }
}

export const tools = {
  couchdb_list_databases: {
    description: "List all databases on the CouchDB server",
    params: {},
    handler: async () => {
      const databases = await couchRequest("/_all_dbs");
      return { count: databases.length, databases };
    },
  },

  couchdb_create_database: {
    description: "Create a new database",
    params: {
      name: { type: "string", description: "Database name" },
    },
    handler: async ({ name }) => {
      const result = await couchRequest(`/${encodeURIComponent(name)}`, {
        method: "PUT",
      });
      return { success: true, database: name, result };
    },
  },

  couchdb_delete_database: {
    description: "Delete a database",
    params: {
      name: { type: "string", description: "Database name" },
    },
    handler: async ({ name }) => {
      const result = await couchRequest(`/${encodeURIComponent(name)}`, {
        method: "DELETE",
      });
      return { success: true, database: name, result };
    },
  },

  couchdb_info: {
    description: "Get database information",
    params: {
      database: { type: "string", description: "Database name (uses COUCHDB_DATABASE if not provided)" },
    },
    handler: async ({ database }) => {
      const db = database || config.database;
      if (!db) throw new Error("Database name required");
      const info = await couchRequest(`/${encodeURIComponent(db)}`);
      return info;
    },
  },

  couchdb_all_docs: {
    description: "Get all documents in a database",
    params: {
      database: { type: "string", description: "Database name (uses COUCHDB_DATABASE if not provided)" },
      include_docs: { type: "string", description: "Include document bodies (true/false, default false)" },
      limit: { type: "string", description: "Max documents to return (default 100)" },
      skip: { type: "string", description: "Number of documents to skip" },
    },
    handler: async ({ database, include_docs, limit, skip }) => {
      const db = database || config.database;
      if (!db) throw new Error("Database name required");

      const params = new URLSearchParams();
      if (include_docs === "true") params.append("include_docs", "true");
      if (limit) params.append("limit", limit);
      else params.append("limit", "100");
      if (skip) params.append("skip", skip);

      const queryString = params.toString();
      const path = `/${encodeURIComponent(db)}/_all_docs${queryString ? "?" + queryString : ""}`;
      const result = await couchRequest(path);

      return {
        total_rows: result.total_rows,
        offset: result.offset,
        count: result.rows.length,
        rows: result.rows,
      };
    },
  },

  couchdb_get: {
    description: "Get a document by ID",
    params: {
      database: { type: "string", description: "Database name (uses COUCHDB_DATABASE if not provided)" },
      id: { type: "string", description: "Document ID" },
      rev: { type: "string", description: "Specific revision (optional)" },
    },
    handler: async ({ database, id, rev }) => {
      const db = database || config.database;
      if (!db) throw new Error("Database name required");
      if (!id) throw new Error("Document ID required");

      let path = `/${encodeURIComponent(db)}/${encodeURIComponent(id)}`;
      if (rev) path += `?rev=${encodeURIComponent(rev)}`;

      const doc = await couchRequest(path);
      return doc;
    },
  },

  couchdb_insert: {
    description: "Create or update a document",
    params: {
      database: { type: "string", description: "Database name (uses COUCHDB_DATABASE if not provided)" },
      document: { type: "string", description: "Document as JSON string" },
      id: { type: "string", description: "Document ID (optional, auto-generated if not provided)" },
    },
    handler: async ({ database, document, id }) => {
      const db = database || config.database;
      if (!db) throw new Error("Database name required");
      if (!document) throw new Error("Document required");

      const doc = JSON.parse(document);

      let path, method;
      if (id) {
        path = `/${encodeURIComponent(db)}/${encodeURIComponent(id)}`;
        method = "PUT";
      } else {
        path = `/${encodeURIComponent(db)}`;
        method = "POST";
      }

      const result = await couchRequest(path, {
        method,
        body: JSON.stringify(doc),
      });

      return { success: result.ok, id: result.id, rev: result.rev };
    },
  },

  couchdb_delete: {
    description: "Delete a document",
    params: {
      database: { type: "string", description: "Database name (uses COUCHDB_DATABASE if not provided)" },
      id: { type: "string", description: "Document ID" },
      rev: { type: "string", description: "Document revision (_rev)" },
    },
    handler: async ({ database, id, rev }) => {
      const db = database || config.database;
      if (!db) throw new Error("Database name required");
      if (!id) throw new Error("Document ID required");
      if (!rev) throw new Error("Document revision required");

      const path = `/${encodeURIComponent(db)}/${encodeURIComponent(id)}?rev=${encodeURIComponent(rev)}`;
      const result = await couchRequest(path, { method: "DELETE" });

      return { success: result.ok, id: result.id, rev: result.rev };
    },
  },

  couchdb_find: {
    description: "Find documents using Mango query selector",
    params: {
      database: { type: "string", description: "Database name (uses COUCHDB_DATABASE if not provided)" },
      selector: { type: "string", description: "Mango selector as JSON (e.g., '{\"type\": \"user\"}')" },
      fields: { type: "string", description: "Fields to return as JSON array (optional)" },
      limit: { type: "string", description: "Max documents to return (default 25)" },
      skip: { type: "string", description: "Number of documents to skip" },
      sort: { type: "string", description: "Sort order as JSON array (optional)" },
    },
    handler: async ({ database, selector, fields, limit, skip, sort }) => {
      const db = database || config.database;
      if (!db) throw new Error("Database name required");
      if (!selector) throw new Error("Selector required");

      const query = {
        selector: JSON.parse(selector),
        limit: limit ? parseInt(limit, 10) : 25,
      };

      if (fields) query.fields = JSON.parse(fields);
      if (skip) query.skip = parseInt(skip, 10);
      if (sort) query.sort = JSON.parse(sort);

      const result = await couchRequest(`/${encodeURIComponent(db)}/_find`, {
        method: "POST",
        body: JSON.stringify(query),
      });

      return {
        count: result.docs.length,
        docs: result.docs,
        bookmark: result.bookmark,
        warning: result.warning,
      };
    },
  },

  couchdb_create_index: {
    description: "Create a Mango index",
    params: {
      database: { type: "string", description: "Database name (uses COUCHDB_DATABASE if not provided)" },
      fields: { type: "string", description: "Fields to index as JSON array (e.g., '[\"type\", \"name\"]')" },
      name: { type: "string", description: "Index name (optional)" },
      ddoc: { type: "string", description: "Design document name (optional)" },
    },
    handler: async ({ database, fields, name: indexName, ddoc }) => {
      const db = database || config.database;
      if (!db) throw new Error("Database name required");
      if (!fields) throw new Error("Fields required");

      const index = {
        index: { fields: JSON.parse(fields) },
      };

      if (indexName) index.name = indexName;
      if (ddoc) index.ddoc = ddoc;

      const result = await couchRequest(`/${encodeURIComponent(db)}/_index`, {
        method: "POST",
        body: JSON.stringify(index),
      });

      return {
        result: result.result,
        id: result.id,
        name: result.name,
      };
    },
  },

  couchdb_view: {
    description: "Query a view",
    params: {
      database: { type: "string", description: "Database name (uses COUCHDB_DATABASE if not provided)" },
      design: { type: "string", description: "Design document name (without _design/ prefix)" },
      view: { type: "string", description: "View name" },
      key: { type: "string", description: "Exact key to match (JSON value)" },
      startkey: { type: "string", description: "Start key (JSON value)" },
      endkey: { type: "string", description: "End key (JSON value)" },
      limit: { type: "string", description: "Max rows to return" },
      include_docs: { type: "string", description: "Include documents (true/false)" },
      reduce: { type: "string", description: "Use reduce function (true/false)" },
      group: { type: "string", description: "Group reduce results (true/false)" },
    },
    handler: async ({ database, design, view, key, startkey, endkey, limit, include_docs, reduce, group }) => {
      const db = database || config.database;
      if (!db) throw new Error("Database name required");
      if (!design) throw new Error("Design document name required");
      if (!view) throw new Error("View name required");

      const params = new URLSearchParams();
      if (key) params.append("key", key);
      if (startkey) params.append("startkey", startkey);
      if (endkey) params.append("endkey", endkey);
      if (limit) params.append("limit", limit);
      if (include_docs === "true") params.append("include_docs", "true");
      if (reduce === "false") params.append("reduce", "false");
      if (group === "true") params.append("group", "true");

      const queryString = params.toString();
      const path = `/${encodeURIComponent(db)}/_design/${encodeURIComponent(design)}/_view/${encodeURIComponent(view)}${queryString ? "?" + queryString : ""}`;
      const result = await couchRequest(path);

      return {
        total_rows: result.total_rows,
        offset: result.offset,
        count: result.rows?.length || 0,
        rows: result.rows,
      };
    },
  },

  couchdb_bulk_docs: {
    description: "Insert, update, or delete multiple documents at once",
    params: {
      database: { type: "string", description: "Database name (uses COUCHDB_DATABASE if not provided)" },
      docs: { type: "string", description: "Array of documents as JSON (include _deleted:true to delete)" },
    },
    handler: async ({ database, docs }) => {
      const db = database || config.database;
      if (!db) throw new Error("Database name required");
      if (!docs) throw new Error("Documents required");

      const result = await couchRequest(`/${encodeURIComponent(db)}/_bulk_docs`, {
        method: "POST",
        body: JSON.stringify({ docs: JSON.parse(docs) }),
      });

      const succeeded = result.filter((r) => r.ok).length;
      const failed = result.filter((r) => r.error).length;

      return {
        total: result.length,
        succeeded,
        failed,
        results: result,
      };
    },
  },

  couchdb_changes: {
    description: "Get database changes feed",
    params: {
      database: { type: "string", description: "Database name (uses COUCHDB_DATABASE if not provided)" },
      since: { type: "string", description: "Start from this sequence (default: 0)" },
      limit: { type: "string", description: "Max changes to return" },
      include_docs: { type: "string", description: "Include document bodies (true/false)" },
    },
    handler: async ({ database, since, limit, include_docs }) => {
      const db = database || config.database;
      if (!db) throw new Error("Database name required");

      const params = new URLSearchParams();
      if (since) params.append("since", since);
      if (limit) params.append("limit", limit);
      else params.append("limit", "100");
      if (include_docs === "true") params.append("include_docs", "true");

      const queryString = params.toString();
      const path = `/${encodeURIComponent(db)}/_changes${queryString ? "?" + queryString : ""}`;
      const result = await couchRequest(path);

      return {
        last_seq: result.last_seq,
        count: result.results.length,
        results: result.results,
      };
    },
  },
};
