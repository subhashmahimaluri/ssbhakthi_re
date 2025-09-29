import { gql } from '@apollo/client';

export const GET_ARTICLES = gql`
  query GetArticles(
    $locale: String
    $status: String
    $search: String
    $limit: Int
    $offset: Int
    $sort: String
  ) {
    articles(
      locale: $locale
      status: $status
      search: $search
      limit: $limit
      offset: $offset
      sort: $sort
    ) {
      id
      title
      slug
      summary
      status
      locale
      publishedAt
      updatedAt
      author {
        id
        name
        email
      }
      categories {
        id
        name
      }
      tags {
        id
        name
      }
    }
  }
`;

export const GET_ARTICLE = gql`
  query GetArticle($id: ID!) {
    article(id: $id) {
      id
      title
      slug
      summary
      body
      status
      locale
      publishedAt
      scheduledAt
      seoTitle
      seoDescription
      seoKeywords
      featuredImage
      createdAt
      updatedAt
      author {
        id
        name
        email
      }
      categories {
        id
        name
      }
      tags {
        id
        name
      }
    }
  }
`;

export const GET_ARTICLE_BY_SLUG = gql`
  query GetArticleBySlug($slug: String!, $locale: String) {
    articleBySlug(slug: $slug, locale: $locale) {
      id
      title
      slug
      summary
      body
      status
      locale
      publishedAt
      scheduledAt
      seoTitle
      seoDescription
      seoKeywords
      featuredImage
      createdAt
      updatedAt
      author {
        id
        name
        email
      }
      categories {
        id
        name
      }
      tags {
        id
        name
      }
    }
  }
`;

export const CREATE_ARTICLE = gql`
  mutation CreateArticle($input: CreateArticleInput!) {
    createArticle(input: $input) {
      id
      title
      slug
      status
      locale
    }
  }
`;

export const UPDATE_ARTICLE = gql`
  mutation UpdateArticle($id: ID!, $input: UpdateArticleInput!) {
    updateArticle(id: $id, input: $input) {
      id
      title
      slug
      status
      locale
      updatedAt
    }
  }
`;

export const DELETE_ARTICLE = gql`
  mutation DeleteArticle($id: ID!) {
    deleteArticle(id: $id)
  }
`;

export const GET_CATEGORIES = gql`
  query GetCategories {
    categories {
      id
      name
      slug
    }
  }
`;

export const GET_TAGS = gql`
  query GetTags {
    tags {
      id
      name
      slug
    }
  }
`;
