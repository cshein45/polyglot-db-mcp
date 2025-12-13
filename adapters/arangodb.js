// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Jonathan D.A. Jewell

/**
 * ArangoDB Adapter
 * Multi-model database: document, graph, key-value
 * Merged from standalone arango-mcp server
 */

import { Database } from "arangojs";

let db = null;
let systemDb = null;

const config = {
  url: Deno.env.get("ARANGO_URL") || "http://localhost:8529",
  database: Deno.env.get("ARANGO_DATABASE") || "_system",
  username: Deno.env.get("ARANGO_USERNAME") || "root",
  password: Deno.env.get("ARANGO_PASSWORD") || "",
};

export const name = "arangodb";
export const description = "ArangoDB multi-model database (document, graph, key-value)";

function getDb() {
  if (!db) {
    db = new Database({
      url: config.url,
      databaseName: config.database,
      auth: { username: config.username, password: config.password },
    });
  }
  return db;
}

function getSystemDb() {
  if (!systemDb) {
    systemDb = new Database({
      url: config.url,
      databaseName: "_system",
      auth: { username: config.username, password: config.password },
    });
  }
  return systemDb;
}

export async function connect() {
  return getDb();
}

export async function disconnect() {
  if (db) {
    db.close();
    db = null;
  }
  if (systemDb) {
    systemDb.close();
    systemDb = null;
  }
}

export async function isConnected() {
  try {
    const conn = getDb();
    await conn.version();
    return true;
  } catch {
    return false;
  }
}

export const tools = {
  arango_list_databases: {
    description: "List all ArangoDB databases",
    params: {},
    handler: async () => {
      const sysDb = getSystemDb();
      const databases = await sysDb.listDatabases();
      return { databases };
    },
  },

  arango_list_collections: {
    description: "List all collections in the current database",
    params: {},
    handler: async () => {
      const collections = await getDb().listCollections();
      const result = collections.map((c) => ({
        name: c.name,
        type: c.type === 2 ? "document" : "edge",
      }));
      return { collections: result };
    },
  },

  arango_collection_info: {
    description: "Get detailed information about a collection",
    params: {
      collection: { type: "string", description: "Collection name" },
    },
    handler: async ({ collection }) => {
      const coll = getDb().collection(collection);
      const [properties, count, indexes] = await Promise.all([
        coll.properties(),
        coll.count(),
        coll.indexes(),
      ]);
      return { properties, count: count.count, indexes };
    },
  },

  arango_create_collection: {
    description: "Create a new document or edge collection",
    params: {
      name: { type: "string", description: "Collection name" },
      type: { type: "string", description: "Collection type: 'document' or 'edge'" },
    },
    handler: async ({ name, type }) => {
      const isEdge = type === "edge";
      if (isEdge) {
        await getDb().createEdgeCollection(name);
      } else {
        await getDb().createCollection(name);
      }
      return { success: true, message: `Collection '${name}' created (${type})` };
    },
  },

  arango_create_index: {
    description: "Create an index on a collection",
    params: {
      collection: { type: "string", description: "Collection name" },
      type: { type: "string", description: "Index type: 'persistent', 'hash', 'skiplist', 'fulltext', 'geo'" },
      fields: { type: "string", description: "Comma-separated field names" },
      unique: { type: "string", description: "Unique index: 'true' or 'false' (default false)" },
    },
    handler: async ({ collection, type, fields, unique }) => {
      const fieldArray = fields.split(",").map((f) => f.trim());
      const isUnique = unique === "true";
      const coll = getDb().collection(collection);
      let result;
      switch (type) {
        case "persistent":
          result = await coll.ensureIndex({ type: "persistent", fields: fieldArray, unique: isUnique });
          break;
        case "hash":
          result = await coll.ensureIndex({ type: "hash", fields: fieldArray, unique: isUnique });
          break;
        case "skiplist":
          result = await coll.ensureIndex({ type: "skiplist", fields: fieldArray, unique: isUnique });
          break;
        case "fulltext":
          result = await coll.ensureIndex({ type: "fulltext", fields: fieldArray });
          break;
        case "geo":
          result = await coll.ensureIndex({ type: "geo", fields: fieldArray });
          break;
        default:
          throw new Error(`Unknown index type: ${type}`);
      }
      return result;
    },
  },

  arango_insert: {
    description: "Insert a document into a collection",
    params: {
      collection: { type: "string", description: "Collection name" },
      document: { type: "string", description: "Document as JSON string" },
    },
    handler: async ({ collection, document }) => {
      const doc = JSON.parse(document);
      const result = await getDb().collection(collection).save(doc);
      return result;
    },
  },

  arango_get: {
    description: "Get a document by its _key",
    params: {
      collection: { type: "string", description: "Collection name" },
      key: { type: "string", description: "Document _key" },
    },
    handler: async ({ collection, key }) => {
      const doc = await getDb().collection(collection).document(key);
      return doc;
    },
  },

  arango_update: {
    description: "Update a document (partial update/merge)",
    params: {
      collection: { type: "string", description: "Collection name" },
      key: { type: "string", description: "Document _key" },
      update: { type: "string", description: "Update data as JSON string" },
    },
    handler: async ({ collection, key, update }) => {
      const data = JSON.parse(update);
      const result = await getDb().collection(collection).update(key, data);
      return result;
    },
  },

  arango_delete: {
    description: "Delete a document by its _key",
    params: {
      collection: { type: "string", description: "Collection name" },
      key: { type: "string", description: "Document _key" },
    },
    handler: async ({ collection, key }) => {
      const result = await getDb().collection(collection).remove(key);
      return result;
    },
  },

  arango_query: {
    description: "Execute an AQL query with optional bind variables",
    params: {
      query: { type: "string", description: "AQL query to execute" },
      bindVars: { type: "string", description: "Bind variables as JSON object (optional)" },
    },
    handler: async ({ query, bindVars }) => {
      const vars = bindVars ? JSON.parse(bindVars) : {};
      const cursor = await getDb().query(query, vars);
      const results = await cursor.all();
      return {
        count: results.length,
        results: results.slice(0, 100),
      };
    },
  },

  arango_explain: {
    description: "Explain an AQL query execution plan",
    params: {
      query: { type: "string", description: "AQL query to explain" },
    },
    handler: async ({ query }) => {
      const explanation = await getDb().explain(query);
      return explanation;
    },
  },

  arango_traverse: {
    description: "Traverse a graph from a start vertex",
    params: {
      startVertex: { type: "string", description: "Start vertex ID (collection/key)" },
      edgeCollection: { type: "string", description: "Edge collection name" },
      direction: { type: "string", description: "Direction: 'outbound', 'inbound', or 'any'" },
      minDepth: { type: "string", description: "Minimum depth (default 1)" },
      maxDepth: { type: "string", description: "Maximum depth (default 1)" },
    },
    handler: async ({ startVertex, edgeCollection, direction, minDepth, maxDepth }) => {
      const min = minDepth ? parseInt(minDepth, 10) : 1;
      const max = maxDepth ? parseInt(maxDepth, 10) : 1;
      const dir = (direction || "outbound").toUpperCase();
      const query = `
        FOR v, e, p IN ${min}..${max} ${dir} @start @@edges
        RETURN { vertex: v, edge: e }
      `;
      const cursor = await getDb().query(query, {
        start: startVertex,
        "@edges": edgeCollection,
      });
      const results = await cursor.all();
      return { count: results.length, results };
    },
  },

  arango_list_graphs: {
    description: "List all named graphs in the database",
    params: {},
    handler: async () => {
      const graphs = await getDb().listGraphs();
      return { graphs };
    },
  },
};
