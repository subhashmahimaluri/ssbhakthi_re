import { SearchResult } from '@/types/search';

import { SearchApiResponse } from '@/types/search';
import { NextApiRequest, NextApiResponse } from 'next';

// Function to search content using direct HTTP request to GraphQL
const searchContentGraphQL = async (
  keyword: string,
  category: string,
  locale: string = 'en',
  limit: number = 20,
  offset: number = 0
): Promise<{ results: SearchResult[]; totalCount: number; hasMore: boolean }> => {
  try {
    console.log('🔍 GraphQL Search Request:', { keyword, category, locale, limit, offset });

    const graphqlEndpoint =
      process.env.NEXT_PUBLIC_BACKEND_GRAPHQL_URL || 'http://localhost:4000/graphql';

    const query = `
      query SearchContent($filters: SearchFilters!, $limit: Int!, $offset: Int!) {
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

    const variables = {
      filters: {
        keyword: keyword || undefined,
        category: category !== 'All' ? category : undefined,
        lang: locale,
      },
      limit,
      offset,
    };

    const response = await fetch(graphqlEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const responseData = await response.json();

    // Handle Apollo Server response format
    let data;
    if (responseData.body?.singleResult?.data) {
      data = responseData.body.singleResult.data;
    } else if (responseData.data) {
      data = responseData.data;
    } else {
      throw new Error('Invalid GraphQL response format');
    }

    if (!data?.search) {
      throw new Error('No search results returned from GraphQL');
    }

    // Transform GraphQL results to match frontend interface
    const transformedResults: SearchResult[] = data.search.results.map((item: any) => ({
      id: item.id,
      canonicalSlug: item.canonicalSlug,
      contentType: item.contentType.toLowerCase(),
      title: item.title,
      description: item.description || '',
      imageUrl: item.imageUrl,
      categories: item.categories || [],
      status: 'published',
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    return {
      results: transformedResults,
      totalCount: data.search.totalCount,
      hasMore: data.search.hasMore,
    };
  } catch (error) {
    console.error('🚨 GraphQL search error:', error);
    console.error('📝 Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    // Return empty results if GraphQL fails
    return {
      results: [],
      totalCount: 0,
      hasMore: false,
    };
  }
};

// Fallback function for when no keyword is provided
const getEmptySearchResponse = (): {
  results: SearchResult[];
  totalCount: number;
  hasMore: boolean;
} => {
  return {
    results: [],
    totalCount: 0,
    hasMore: false,
  };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SearchApiResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    const {
      keyword = '',
      category = 'All',
      locale = 'en',
      page = '1',
      pageSize = '20',
    } = req.query;

    // Validate input
    if (typeof keyword !== 'string' || typeof category !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid search parameters',
      });
    }

    // Calculate pagination
    const pageNum = Math.max(parseInt(page as string, 10) || 1, 1);
    const pageSizeNum = Math.min(Math.max(parseInt(pageSize as string, 10) || 20, 1), 100);
    const offset = (pageNum - 1) * pageSizeNum;

    // Perform search or return empty results if no keyword
    let searchResults;
    if (!keyword.trim()) {
      // Return empty results for empty search
      searchResults = getEmptySearchResponse();
    } else {
      // Perform actual search
      searchResults = await searchContentGraphQL(
        keyword.trim(),
        category,
        locale as string,
        pageSizeNum,
        offset
      );
    }

    // Prepare response
    const response: SearchApiResponse = {
      success: true,
      data: {
        results: searchResults.results,
        totalCount: searchResults.totalCount,
        query: keyword,
        category,
        hasMore: searchResults.hasMore,
        page: pageNum,
        pageSize: pageSizeNum,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Search API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
}
