export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  body?: string;
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  locale: string;
  publishedAt?: string;
  scheduledAt?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  featuredImage?: string;
  createdAt: string;
  updatedAt: string;
  author: User;
  categories: Category[];
  tags: Tag[];
}

export interface CreateArticleInput {
  title: string;
  slug?: string;
  summary?: string;
  body?: string;
  status?: 'draft' | 'published' | 'scheduled';
  locale: string;
  scheduledAt?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  featuredImage?: string;
  categoryIds?: string[];
  tagIds?: string[];
}

export interface UpdateArticleInput {
  title?: string;
  slug?: string;
  summary?: string;
  body?: string;
  status?: 'draft' | 'published' | 'scheduled' | 'archived';
  scheduledAt?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  featuredImage?: string;
  categoryIds?: string[];
  tagIds?: string[];
}

export interface ArticlesResponse {
  articles: Article[];
}

export interface ArticleResponse {
  article: Article;
}

export interface CategoriesResponse {
  categories: Category[];
}

export interface TagsResponse {
  tags: Tag[];
}
