// Search-related TypeScript interfaces
export interface SearchFilters {
  All: string;
  stotras: string;
  sahasranamam: string;
  ashtottara_shatanamavali: string;
  sahasranamavali: string;
  articles: string;
}

export interface SearchResult {
  id: string;
  canonicalSlug: string;
  contentType: 'stotra' | 'sahasranamam' | 'ashtottara_shatanamavali' | 'sahasranamavali' | 'article';
  title: string;
  description?: string;
  imageUrl?: string;
  categories?: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
  // For backward compatibility with old API structure
  nid?: string;
  field_display_title?: string;
  field_category?: string;
  field_image?: string;
  view_node?: string;
  type?: string;
}

export interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
  query: string;
  category: string;
  hasMore?: boolean;
  page?: number;
  pageSize?: number;
}

export interface SearchApiResponse {
  success: boolean;
  data?: SearchResponse;
  error?: string;
  message?: string;
}

export interface SearchPageProps {
  searchResults?: SearchResult[];
  query?: string;
  category?: string;
  totalCount?: number;
  error?: string;
  metaTitle?: string;
  metaDesc?: string;
}

export type ContentTypeMap = {
  [key: string]: string;
};

export const CONTENT_TYPE_ROUTES: ContentTypeMap = {
  'Article': 'articles',
  'Calendar': 'calendar',
  'Ashtottara Shatanamavali': 'ashtothram',
  'Sahasra Namavali': 'sahasranamavali',
  'Sahasranama Stotram': 'sahasranamam',
  'Stotra': 'stotras',
  'stotra': 'stotras',
  'sahasranamam': 'sahasranamam',
  'ashtottara_shatanamavali': 'ashtothram',
  'sahasranamavali': 'sahasranamavali',
  'articles': 'articles',
  'article': 'articles',
};

export const SEARCH_FILTER_OPTIONS = [
  { value: 'All', label: 'All Stotras & Namavali' },
  { value: 'stotras', label: 'Stotras' },
  { value: 'sahasranamam', label: 'Sahasranamam' },
  { value: 'ashtottara_shatanamavali', label: 'Ashtottara Shatanamavali' },
  { value: 'sahasranamavali', label: 'Sahasranamavali' },
  { value: 'articles', label: 'Articles' },
];