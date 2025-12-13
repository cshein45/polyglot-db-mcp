// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Jonathan D.A. Jewell

/**
 * Virtuoso Adapter
 * OpenLink Virtuoso RDF triplestore and SPARQL endpoint
 * Merged from standalone virtuoso-mcp server
 */

let connected = false;

const config = {
  endpoint: Deno.env.get("VIRTUOSO_ENDPOINT") || "http://localhost:8890/sparql",
  updateEndpoint: Deno.env.get("VIRTUOSO_UPDATE_ENDPOINT") || "http://localhost:8890/sparql-auth",
  username: Deno.env.get("VIRTUOSO_USERNAME") || "",
  password: Deno.env.get("VIRTUOSO_PASSWORD") || "",
  defaultGraph: Deno.env.get("VIRTUOSO_DEFAULT_GRAPH") || "",
};

export const name = "virtuoso";
export const description = "OpenLink Virtuoso RDF triplestore and SPARQL endpoint";

function getAuthHeader() {
  if (config.username && config.password) {
    const credentials = btoa(`${config.username}:${config.password}`);
    return { Authorization: `Basic ${credentials}` };
  }
  return {};
}

async function sparqlQuery(query, accept = "application/sparql-results+json") {
  const params = new URLSearchParams();
  params.append("query", query);
  if (config.defaultGraph) {
    params.append("default-graph-uri", config.defaultGraph);
  }

  const response = await fetch(config.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: accept,
      ...getAuthHeader(),
    },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error(`SPARQL error: ${response.status} ${await response.text()}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("json")) {
    return await response.json();
  }
  return await response.text();
}

async function sparqlUpdate(query) {
  const params = new URLSearchParams();
  params.append("query", query);

  const response = await fetch(config.updateEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      ...getAuthHeader(),
    },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error(`SPARQL Update error: ${response.status} ${await response.text()}`);
  }

  return await response.text();
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
    const query = "ASK { ?s ?p ?o } LIMIT 1";
    await sparqlQuery(query);
    connected = true;
    return true;
  } catch {
    connected = false;
    return false;
  }
}

export const tools = {
  virtuoso_select: {
    description: "Execute SPARQL SELECT query",
    params: {
      query: { type: "string", description: "SPARQL SELECT query" },
      limit: { type: "string", description: "Max results (default 100)" },
    },
    handler: async ({ query, limit }) => {
      const maxResults = limit ? parseInt(limit, 10) : 100;
      const limitedQuery = query.toLowerCase().includes("limit")
        ? query
        : `${query} LIMIT ${maxResults}`;

      const result = await sparqlQuery(limitedQuery);

      if (result.results && result.results.bindings) {
        const bindings = result.results.bindings;
        const formatted = bindings.map((row) => {
          const obj = {};
          for (const [key, val] of Object.entries(row)) {
            obj[key] = val.value;
          }
          return obj;
        });
        return { count: formatted.length, results: formatted };
      }
      return result;
    },
  },

  virtuoso_ask: {
    description: "Execute SPARQL ASK query (returns boolean)",
    params: {
      query: { type: "string", description: "SPARQL ASK query" },
    },
    handler: async ({ query }) => {
      const result = await sparqlQuery(query);
      return { answer: result.boolean };
    },
  },

  virtuoso_construct: {
    description: "Execute SPARQL CONSTRUCT query",
    params: {
      query: { type: "string", description: "SPARQL CONSTRUCT query" },
      format: { type: "string", description: "Output format: turtle, ntriples, rdfxml, jsonld (default: turtle)" },
    },
    handler: async ({ query, format }) => {
      const acceptTypes = {
        turtle: "text/turtle",
        ntriples: "application/n-triples",
        rdfxml: "application/rdf+xml",
        jsonld: "application/ld+json",
      };
      const accept = acceptTypes[format || "turtle"] || "text/turtle";
      const result = await sparqlQuery(query, accept);
      return { format: format || "turtle", data: result };
    },
  },

  virtuoso_describe: {
    description: "Describe an RDF resource",
    params: {
      uri: { type: "string", description: "URI of resource to describe" },
      format: { type: "string", description: "Output format: turtle, ntriples, rdfxml, jsonld (default: turtle)" },
    },
    handler: async ({ uri, format }) => {
      const query = `DESCRIBE <${uri}>`;
      const acceptTypes = {
        turtle: "text/turtle",
        ntriples: "application/n-triples",
        rdfxml: "application/rdf+xml",
        jsonld: "application/ld+json",
      };
      const accept = acceptTypes[format || "turtle"] || "text/turtle";
      const result = await sparqlQuery(query, accept);
      return { uri, format: format || "turtle", data: result };
    },
  },

  virtuoso_insert: {
    description: "Insert RDF triples",
    params: {
      triples: { type: "string", description: "Triples in Turtle format (e.g., '<s> <p> <o> .')" },
      graph: { type: "string", description: "Target graph URI (optional)" },
    },
    handler: async ({ triples, graph }) => {
      const graphClause = graph ? `INTO GRAPH <${graph}>` : "";
      const query = `INSERT DATA { ${graphClause} { ${triples} } }`;
      const result = await sparqlUpdate(query);
      return { success: true, message: `Insert successful. ${result}` };
    },
  },

  virtuoso_delete: {
    description: "Delete RDF triples",
    params: {
      triples: { type: "string", description: "Triples pattern in Turtle format" },
      graph: { type: "string", description: "Target graph URI (optional)" },
    },
    handler: async ({ triples, graph }) => {
      const graphClause = graph ? `FROM GRAPH <${graph}>` : "";
      const query = `DELETE DATA { ${graphClause} { ${triples} } }`;
      const result = await sparqlUpdate(query);
      return { success: true, message: `Delete successful. ${result}` };
    },
  },

  virtuoso_update: {
    description: "Execute generic SPARQL UPDATE query",
    params: {
      query: { type: "string", description: "SPARQL UPDATE query" },
    },
    handler: async ({ query }) => {
      const result = await sparqlUpdate(query);
      return { success: true, message: `Update successful. ${result}` };
    },
  },

  virtuoso_list_graphs: {
    description: "List all named graphs with triple counts",
    params: {},
    handler: async () => {
      const query = `
        SELECT DISTINCT ?g (COUNT(*) as ?triples)
        WHERE { GRAPH ?g { ?s ?p ?o } }
        GROUP BY ?g
        ORDER BY DESC(?triples)
        LIMIT 100
      `;
      const result = await sparqlQuery(query);
      const graphs = result.results.bindings.map((row) => ({
        graph: row.g.value,
        triples: parseInt(row.triples.value),
      }));
      return { count: graphs.length, graphs };
    },
  },

  virtuoso_graph_stats: {
    description: "Get statistics for a graph (triple count, top predicates, top classes)",
    params: {
      graph: { type: "string", description: "Graph URI (optional, uses default graph if empty)" },
    },
    handler: async ({ graph }) => {
      const graphClause = graph ? `FROM <${graph}>` : "";

      // Get triple count
      const countQuery = `SELECT (COUNT(*) as ?count) ${graphClause} WHERE { ?s ?p ?o }`;
      const countResult = await sparqlQuery(countQuery);
      const tripleCount = parseInt(countResult.results.bindings[0]?.count?.value || 0);

      // Get predicate distribution
      const predQuery = `
        SELECT ?p (COUNT(*) as ?count) ${graphClause}
        WHERE { ?s ?p ?o }
        GROUP BY ?p
        ORDER BY DESC(?count)
        LIMIT 20
      `;
      const predResult = await sparqlQuery(predQuery);
      const predicates = predResult.results.bindings.map((row) => ({
        predicate: row.p.value,
        count: parseInt(row.count.value),
      }));

      // Get class distribution
      const classQuery = `
        SELECT ?class (COUNT(?s) as ?count) ${graphClause}
        WHERE { ?s a ?class }
        GROUP BY ?class
        ORDER BY DESC(?count)
        LIMIT 20
      `;
      const classResult = await sparqlQuery(classQuery);
      const classes = classResult.results.bindings.map((row) => ({
        class: row.class.value,
        count: parseInt(row.count.value),
      }));

      return {
        graph: graph || "default",
        tripleCount,
        topPredicates: predicates,
        topClasses: classes,
      };
    },
  },

  virtuoso_find_by_type: {
    description: "Find resources by RDF type",
    params: {
      type: { type: "string", description: "RDF type URI" },
      graph: { type: "string", description: "Graph URI (optional)" },
      limit: { type: "string", description: "Max results (default 50)" },
    },
    handler: async ({ type, graph, limit }) => {
      const maxResults = limit ? parseInt(limit, 10) : 50;
      const graphClause = graph ? `FROM <${graph}>` : "";
      const query = `
        SELECT ?resource ?label ${graphClause}
        WHERE {
          ?resource a <${type}> .
          OPTIONAL { ?resource rdfs:label ?label }
        }
        LIMIT ${maxResults}
      `;
      const result = await sparqlQuery(query);
      const resources = result.results.bindings.map((row) => ({
        uri: row.resource.value,
        label: row.label?.value,
      }));
      return { count: resources.length, resources };
    },
  },

  virtuoso_text_search: {
    description: "Full-text search using Virtuoso bif:contains",
    params: {
      pattern: { type: "string", description: "Search pattern" },
      graph: { type: "string", description: "Graph URI (optional)" },
      limit: { type: "string", description: "Max results (default 50)" },
    },
    handler: async ({ pattern, graph, limit }) => {
      const maxResults = limit ? parseInt(limit, 10) : 50;
      const graphClause = graph ? `FROM <${graph}>` : "";
      const query = `
        SELECT ?s ?p ?o ${graphClause}
        WHERE {
          ?s ?p ?o .
          ?o bif:contains '${pattern.replace(/'/g, "''")}'
        }
        LIMIT ${maxResults}
      `;
      const result = await sparqlQuery(query);
      const matches = result.results.bindings.map((row) => ({
        subject: row.s.value,
        predicate: row.p.value,
        object: row.o.value,
      }));
      return { count: matches.length, matches };
    },
  },

  virtuoso_list_prefixes: {
    description: "List namespaces/prefixes used in the data",
    params: {},
    handler: async () => {
      const query = `
        SELECT DISTINCT
          (REPLACE(STR(?p), "(#|/)[^#/]*$", "$1") as ?namespace)
        WHERE { ?s ?p ?o }
        LIMIT 100
      `;
      const result = await sparqlQuery(query);
      const namespaces = [...new Set(
        result.results.bindings
          .map((row) => row.namespace?.value)
          .filter(Boolean)
      )];
      return { count: namespaces.length, namespaces };
    },
  },

  virtuoso_load_rdf: {
    description: "Load RDF data from a URL into a graph",
    params: {
      url: { type: "string", description: "URL of RDF data to load" },
      graph: { type: "string", description: "Target graph URI" },
    },
    handler: async ({ url, graph }) => {
      const query = `LOAD <${url}> INTO GRAPH <${graph}>`;
      const result = await sparqlUpdate(query);
      return { success: true, message: `Load successful. ${result}` };
    },
  },

  virtuoso_clear_graph: {
    description: "Clear all triples from a graph",
    params: {
      graph: { type: "string", description: "Graph URI to clear" },
    },
    handler: async ({ graph }) => {
      const query = `CLEAR GRAPH <${graph}>`;
      const result = await sparqlUpdate(query);
      return { success: true, message: `Graph cleared. ${result}` };
    },
  },
};
