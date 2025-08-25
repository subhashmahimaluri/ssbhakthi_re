'use client';

import { useApollo } from '@/lib/apollo-client';
import { ApolloProvider } from '@apollo/client/react';
import { useSession } from 'next-auth/react';
import { ReactNode } from 'react';

interface AdminApolloProviderProps {
  children: ReactNode;
}

export default function AdminApolloProvider({ children }: AdminApolloProviderProps) {
  const { data: session } = useSession();
  const apolloClient = useApollo(null, session?.accessToken);

  return <ApolloProvider client={apolloClient}>{children}</ApolloProvider>;
}
