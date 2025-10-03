import { ApolloServer } from '@apollo/server';
import { ApolloServer } from '@apollo/server';
import express from 'express';
import { readFileSync } from 'fs';
import { GraphQLFormattedError } from 'graphql';
import { join } from 'path';

import { appConfig, isDevelopment } from '../config/app';
import { GraphQLContext } from './context';
import { createDataLoaders } from './loaders';
import { resolvers } from './resolvers';

// Load schema from file
const typeDefs = readFileSync(join(__dirname, 'schema.graphql'), 'utf8');

// Custom error formatter
const formatError = (formattedError: GraphQLFormattedError): GraphQLFormattedError => {
  if (isDevelopment()) {
  }

  if (!isDevelopment() && formattedError.message.includes('Internal server error')) {
    return {
      message: 'Internal server error',
      extensions: {
        code: 'INTERNAL_ERROR',
      },
    };
  }

  return formattedError;
};

// Create Apollo Server
export const apolloServer = new ApolloServer<GraphQLContext>({
  typeDefs,
  resolvers,
  introspection: appConfig.graphql.introspection,
  formatError,
});

// Context factory
export const createContext = async ({ req }: { req: any }): Promise<GraphQLContext> => {
  let user = req.user;
  const dataloaders = createDataLoaders();

  // Development bypass - provide a fake user if none exists
  if (!user && isDevelopment()) {
    console.log('🚀 [GraphQL Context] Using development bypass for authentication');
    user = {
      sub: 'dev-user-123',
      email: 'dev@example.com',
      preferred_username: 'developer',
      name: 'Development User',
      roles: ['admin', 'editor', 'author'],
    };
  }

  return {
    req,
    user,
    dataloaders,
  };
};

// Create a simple GraphQL middleware
export const createGraphQLMiddleware = () => {
  return async (req: express.Request, res: express.Response) => {
    try {
      // For now, we'll implement a basic GraphQL handler
      // This is a simplified version - in production you'd use expressMiddleware
      if (req.method === 'GET' && appConfig.graphql.playground) {
        res.type('html').send(getPlaygroundHTML());
        return;
      }

      if (req.method === 'POST') {
        const { query, variables } = req.body;
        const context = await createContext({ req });

        const result = await apolloServer.executeOperation(
          { query, variables },
          { contextValue: context }
        );

        res.json(result);
        return;
      }

      res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
      res.status(500).json({
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR',
        },
      });
    }
  };
};

// Simple GraphQL Playground HTML
const getPlaygroundHTML = () => `
<!DOCTYPE html>
<html>
<head>
  <title>GraphQL Playground</title>
  <style>
    body { margin: 0; font-family: Arial, sans-serif; }
    .playground { height: 100vh; display: flex; flex-direction: column; }
    .header { background: #1f2937; color: white; padding: 1rem; }
    .content { flex: 1; display: flex; }
    .editor, .result { flex: 1; margin: 1rem; }
    textarea { width: 100%; height: 300px; font-family: monospace; }
    button { background: #3b82f6; color: white; border: none; padding: 0.5rem 1rem; cursor: pointer; }
  </style>
</head>
<body>
  <div class="playground">
    <div class="header">
      <h1>GraphQL Playground</h1>
      <p>Try the ping query: <code>{ ping }</code></p>
    </div>
    <div class="content">
      <div class="editor">
        <h3>Query</h3>
        <textarea id="query" placeholder="{ ping }">{ ping }</textarea>
        <br><br>
        <button onclick="executeQuery()">Execute Query</button>
      </div>
      <div class="result">
        <h3>Result</h3>
        <pre id="result"></pre>
      </div>
    </div>
  </div>
  <script>
    async function executeQuery() {
      const query = document.getElementById('query').value;
      try {
        const response = await fetch('/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query })
        });
        const result = await response.json();
        document.getElementById('result').textContent = JSON.stringify(result, null, 2);
      } catch (error) {
        document.getElementById('result').textContent = 'Error: ' + error.message;
      }
    }
  </script>
</body>
</html>
`;
