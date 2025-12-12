// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Jonathan D.A. Jewell

/**
 * MongoDB Adapter
 * Document database with flexible schemas
 */

import { MongoClient, ObjectId } from "npm:mongodb@6.12.0";

let client = null;
let db = null;

const config = {
  url: Deno.env.get("MONGODB_URL") || "mongodb://localhost:27017",
  database: Deno.env.get("MONGODB_DATABASE") || "test",
  // Pool configuration
  maxPoolSize: parseInt(Deno.env.get("MONGODB_POOL_MAX") || "10"),
  minPoolSize: parseInt(Deno.env.get("MONGODB_POOL_MIN") || "1"),
  maxIdleTimeMS: parseInt(Deno.env.get("MONGODB_IDLE_TIMEOUT") || "30000"),
  connectTimeoutMS: parseInt(Deno.env.get("MONGODB_CONNECT_TIMEOUT") || "10000"),
  serverSelectionTimeoutMS: parseInt(Deno.env.get("MONGODB_SERVER_TIMEOUT") || "30000"),
};

export async function connect() {
  if (client && db) return db;
  try {
    client = new MongoClient(config.url, {
      maxPoolSize: config.maxPoolSize,
      minPoolSize: config.minPoolSize,
      maxIdleTimeMS: config.maxIdleTimeMS,
      connectTimeoutMS: config.connectTimeoutMS,
      serverSelectionTimeoutMS: config.serverSelectionTimeoutMS,
    });
    await client.connect();
    db = client.db(config.database);
    return db;
  } catch (error) {
    throw new Error(`MongoDB connection failed: ${error.message}. Check MONGODB_URL and MONGODB_DATABASE.`);
  }
}

export async function disconnect() {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

export async function isConnected() {
  try {
    const conn = await connect();
    await conn.command({ ping: 1 });
    return true;
  } catch {
    return false;
  }
}

export const name = "mongodb";
export const description = "MongoDB - Document database with flexible schemas";

function parseObjectId(id) {
  try {
    return new ObjectId(id);
  } catch {
    return id;
  }
}

export const tools = {
  mongo_find: {
    description: "Find documents in a collection",
    params: {
      collection: { type: "string", description: "Collection name" },
      filter: { type: "string", description: "Query filter as JSON (default: {})" },
      projection: { type: "string", description: "Fields to include/exclude as JSON (optional)" },
      sort: { type: "string", description: "Sort specification as JSON (optional)" },
      limit: { type: "number", description: "Max documents (default 100)" },
      skip: { type: "number", description: "Documents to skip (default 0)" },
    },
    handler: async ({ collection, filter = "{}", projection, sort, limit = 100, skip = 0 }) => {
      const conn = await connect();
      const coll = conn.collection(collection);
      let cursor = coll.find(JSON.parse(filter));
      if (projection) cursor = cursor.project(JSON.parse(projection));
      if (sort) cursor = cursor.sort(JSON.parse(sort));
      cursor = cursor.skip(skip).limit(limit);
      const docs = await cursor.toArray();
      return { documents: docs, count: docs.length };
    },
  },

  mongo_find_one: {
    description: "Find a single document",
    params: {
      collection: { type: "string", description: "Collection name" },
      filter: { type: "string", description: "Query filter as JSON" },
    },
    handler: async ({ collection, filter }) => {
      const conn = await connect();
      const filterObj = JSON.parse(filter);
      if (filterObj._id) filterObj._id = parseObjectId(filterObj._id);
      const doc = await conn.collection(collection).findOne(filterObj);
      return { document: doc, found: doc !== null };
    },
  },

  mongo_insert_one: {
    description: "Insert a single document",
    params: {
      collection: { type: "string", description: "Collection name" },
      document: { type: "string", description: "Document as JSON" },
    },
    handler: async ({ collection, document }) => {
      const conn = await connect();
      const result = await conn.collection(collection).insertOne(JSON.parse(document));
      return { insertedId: result.insertedId, acknowledged: result.acknowledged };
    },
  },

  mongo_insert_many: {
    description: "Insert multiple documents",
    params: {
      collection: { type: "string", description: "Collection name" },
      documents: { type: "string", description: "Array of documents as JSON" },
    },
    handler: async ({ collection, documents }) => {
      const conn = await connect();
      const result = await conn.collection(collection).insertMany(JSON.parse(documents));
      return { insertedCount: result.insertedCount, insertedIds: result.insertedIds };
    },
  },

  mongo_update_one: {
    description: "Update a single document",
    params: {
      collection: { type: "string", description: "Collection name" },
      filter: { type: "string", description: "Query filter as JSON" },
      update: { type: "string", description: "Update operations as JSON (e.g., {$set: {...}})" },
      upsert: { type: "boolean", description: "Create if not exists (default false)" },
    },
    handler: async ({ collection, filter, update, upsert = false }) => {
      const conn = await connect();
      const filterObj = JSON.parse(filter);
      if (filterObj._id) filterObj._id = parseObjectId(filterObj._id);
      const result = await conn.collection(collection).updateOne(
        filterObj,
        JSON.parse(update),
        { upsert }
      );
      return {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        upsertedId: result.upsertedId,
      };
    },
  },

  mongo_update_many: {
    description: "Update multiple documents",
    params: {
      collection: { type: "string", description: "Collection name" },
      filter: { type: "string", description: "Query filter as JSON" },
      update: { type: "string", description: "Update operations as JSON" },
    },
    handler: async ({ collection, filter, update }) => {
      const conn = await connect();
      const result = await conn.collection(collection).updateMany(
        JSON.parse(filter),
        JSON.parse(update)
      );
      return { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount };
    },
  },

  mongo_delete_one: {
    description: "Delete a single document",
    params: {
      collection: { type: "string", description: "Collection name" },
      filter: { type: "string", description: "Query filter as JSON" },
    },
    handler: async ({ collection, filter }) => {
      const conn = await connect();
      const filterObj = JSON.parse(filter);
      if (filterObj._id) filterObj._id = parseObjectId(filterObj._id);
      const result = await conn.collection(collection).deleteOne(filterObj);
      return { deletedCount: result.deletedCount };
    },
  },

  mongo_delete_many: {
    description: "Delete multiple documents",
    params: {
      collection: { type: "string", description: "Collection name" },
      filter: { type: "string", description: "Query filter as JSON" },
    },
    handler: async ({ collection, filter }) => {
      const conn = await connect();
      const result = await conn.collection(collection).deleteMany(JSON.parse(filter));
      return { deletedCount: result.deletedCount };
    },
  },

  mongo_aggregate: {
    description: "Run an aggregation pipeline",
    params: {
      collection: { type: "string", description: "Collection name" },
      pipeline: { type: "string", description: "Aggregation pipeline as JSON array" },
    },
    handler: async ({ collection, pipeline }) => {
      const conn = await connect();
      const result = await conn.collection(collection).aggregate(JSON.parse(pipeline)).toArray();
      return { results: result, count: result.length };
    },
  },

  mongo_count: {
    description: "Count documents matching a filter",
    params: {
      collection: { type: "string", description: "Collection name" },
      filter: { type: "string", description: "Query filter as JSON (default: {})" },
    },
    handler: async ({ collection, filter = "{}" }) => {
      const conn = await connect();
      const count = await conn.collection(collection).countDocuments(JSON.parse(filter));
      return { count };
    },
  },

  mongo_distinct: {
    description: "Get distinct values for a field",
    params: {
      collection: { type: "string", description: "Collection name" },
      field: { type: "string", description: "Field name" },
      filter: { type: "string", description: "Query filter as JSON (optional)" },
    },
    handler: async ({ collection, field, filter = "{}" }) => {
      const conn = await connect();
      const values = await conn.collection(collection).distinct(field, JSON.parse(filter));
      return { field, values, count: values.length };
    },
  },

  mongo_collections: {
    description: "List all collections in the database",
    params: {},
    handler: async () => {
      const conn = await connect();
      const collections = await conn.listCollections().toArray();
      return { collections: collections.map((c) => c.name), count: collections.length };
    },
  },

  mongo_create_index: {
    description: "Create an index on a collection",
    params: {
      collection: { type: "string", description: "Collection name" },
      keys: { type: "string", description: "Index keys as JSON (e.g., {field: 1})" },
      options: { type: "string", description: "Index options as JSON (optional)" },
    },
    handler: async ({ collection, keys, options = "{}" }) => {
      const conn = await connect();
      const indexName = await conn.collection(collection).createIndex(
        JSON.parse(keys),
        JSON.parse(options)
      );
      return { indexName, created: true };
    },
  },

  mongo_indexes: {
    description: "List indexes on a collection",
    params: {
      collection: { type: "string", description: "Collection name" },
    },
    handler: async ({ collection }) => {
      const conn = await connect();
      const indexes = await conn.collection(collection).indexes();
      return { indexes };
    },
  },
};
