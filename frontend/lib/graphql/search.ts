import { gql } from '@apollo/client';

export const SEARCH_CONTENT = gql`
  query SearchContent($filters: SearchFilters!, $limit: Int = 20, $offset: Int = 0) {
    search(filters: $filters, limit: $limit, offset: $offset) {
      results {
        id
        contentType
        canonicalSlug
        title
        description
        imageUrl
        categories
        createdAt
        updatedAt
      }
      totalCount
      hasMore
    }
  }
`;

export const GET_CONTENT = gql`
  query GetContent($canonicalSlug: String!) {
    content(canonicalSlug: $canonicalSlug) {
      id
      contentType
      canonicalSlug
      stotraTitle
      categories
      imageUrl
      status
      translations
      createdAt
      updatedAt
    }
  }
`;

export const GET_CONTENTS = gql`
  query GetContents($filters: SearchFilters, $limit: Int = 20, $offset: Int = 0) {
    contents(filters: $filters, limit: $limit, offset: $offset) {
      id
      contentType
      canonicalSlug
      stotraTitle
      categories
      imageUrl
      status
      translations
      createdAt
      updatedAt
    }
  }
`;
