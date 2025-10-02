import { ApolloClient, createHttpLink, from, InMemoryCache } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';

let apolloClient: any;

function createApolloClient(accessToken?: string) {
  const httpLink = createHttpLink({
    uri: process.env.NEXT_PUBLIC_BACKEND_GRAPHQL_URL || 'http://localhost:4000/graphql',
  });

  const authLink = setContext((_, { headers }) => {
    return {
      headers: {
        ...headers,
        ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
      },
    };
  });

  const errorLink = onError(errorResponse => {
    const { graphQLErrors, networkError } = errorResponse;
    if (graphQLErrors) {
      graphQLErrors.forEach((error: any) => {
        // GraphQL error occurred
        console.error('GraphQL error:', error.message);
      });
    }

    if (networkError) {
      // Network error occurred
      console.error('Network error:', networkError);

      // Handle 401 errors by redirecting to sign-in
      if ('statusCode' in networkError && networkError.statusCode === 401) {
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/signin';
        }
      }
    }
  });

  return new ApolloClient({
    link: from([errorLink, authLink, httpLink]),
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        errorPolicy: 'all',
      },
      query: {
        errorPolicy: 'all',
      },
    },
  });
}

export function initializeApollo(initialState: any = null, accessToken?: string) {
  const _apolloClient = apolloClient ?? createApolloClient(accessToken);

  // If your page has Next.js data fetching methods that use Apollo Client,
  // the initial state gets hydrated here
  if (initialState) {
    // Get existing cache, loaded during client side data fetching
    const existingCache = _apolloClient.extract();

    // Merge the existing cache into data passed from getStaticProps/getServerSideProps
    const data = { ...existingCache, ...initialState };

    // Restore the cache with the merged data
    _apolloClient.cache.restore(data);
  }

  // For SSG and SSR always create a new Apollo Client
  if (typeof window === 'undefined') return _apolloClient;

  // Create the Apollo Client once in the client
  if (!apolloClient) apolloClient = _apolloClient;
  return _apolloClient;
}

export function useApollo(initialState: any, accessToken?: string) {
  const store = initializeApollo(initialState, accessToken);
  return store;
}
