import { useTranslation } from '@/hooks/useTranslation';
import Link from 'next/link';
import React from 'react';

interface SearchSidebarProps {
  query?: string;
  category?: string;
  totalResults?: number;
}

const SearchSidebar: React.FC<SearchSidebarProps> = ({ query, category, totalResults }) => {
  const { t, locale } = useTranslation();

  // Popular search categories
  const popularCategories = [
    { name: 'Stotras', value: 'stotras', icon: 'fas fa-om', count: '500+' },
    { name: 'Sahasranamam', value: 'sahasranamam', icon: 'fas fa-scroll', count: '50+' },
    { name: 'Ashtottara', value: 'ashtottara_shatanamavali', icon: 'fas fa-list', count: '100+' },
    { name: 'Sahasranamavali', value: 'sahasranamavali', icon: 'fas fa-star', count: '75+' },
    { name: 'Articles', value: 'articles', icon: 'fas fa-newspaper', count: '200+' },
  ];

  // Search tips
  const searchTips = [
    'Use specific deity names for better results',
    'Try searching by occasion or festival',
    'Use Sanskrit terms for traditional content',
    'Browse by categories for exploration',
  ];

  // Popular searches (could be dynamic in the future)
  const popularSearches = [
    'Ganesha stotras',
    'Vishnu sahasranamam',
    'Shiva stotras',
    'Devi mantras',
    'Hanuman chalisa',
    'Krishna stotras',
  ];

  return (
    <div className="search-sidebar">
      {/* Search Summary */}
      {query && (
        <div className="mb-4 rounded bg-white p-3 shadow-sm">
          <h5 className="text-primary mb-2">Search Summary</h5>
          <div className="small text-muted">
            <div>
              <strong>Query:</strong> {query}
            </div>
            <div>
              <strong>Category:</strong> {category === 'All' ? 'All Categories' : category}
            </div>
            {totalResults !== undefined && (
              <div>
                <strong>Results:</strong> {totalResults} found
              </div>
            )}
          </div>
        </div>
      )}

      {/* Browse by Categories */}
      <div className="mb-4 rounded bg-white p-3 shadow-sm">
        <h5 className="text-primary mb-3">Browse by Category</h5>
        <div className="category-list">
          {popularCategories.map(cat => (
            <Link
              key={cat.value}
              href={`/search?keyword=&category=${cat.value}`}
              className={`d-flex justify-content-between align-items-center text-decoration-none mb-2 rounded p-2 ${
                category === cat.value ? 'bg-primary text-white' : 'text-dark hover-bg-light'
              }`}
            >
              <div className="d-flex align-items-center">
                <i className={`${cat.icon} me-2`}></i>
                <span className="small">{cat.name}</span>
              </div>
              <span className="badge bg-secondary small">{cat.count}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Popular Searches */}
      <div className="mb-4 rounded bg-white p-3 shadow-sm">
        <h5 className="text-primary mb-3">Popular Searches</h5>
        <div className="popular-searches">
          {popularSearches.map((searchTerm, index) => (
            <Link
              key={index}
              href={`/search?keyword=${encodeURIComponent(searchTerm)}&category=All`}
              className="d-block text-decoration-none text-dark hover-bg-light small mb-1 rounded p-2"
            >
              <i className="fas fa-search text-muted me-2"></i>
              {searchTerm}
            </Link>
          ))}
        </div>
      </div>

      {/* Search Tips */}
      <div className="mb-4 rounded bg-white p-3 shadow-sm">
        <h5 className="text-primary mb-3">Search Tips</h5>
        <ul className="list-unstyled small">
          {searchTips.map((tip, index) => (
            <li key={index} className="d-flex align-items-start mb-2">
              <i className="fas fa-lightbulb text-warning me-2 mt-1"></i>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Quick Links */}
      <div className="mb-4 rounded bg-white p-3 shadow-sm">
        <h5 className="text-primary mb-3">Quick Links</h5>
        <div className="quick-links">
          <Link
            href="/stotras"
            className="d-block text-decoration-none text-dark hover-bg-light small mb-1 rounded p-2"
          >
            <i className="fas fa-list me-2"></i>
            All Stotras
          </Link>
          <Link
            href="/sahasranamam"
            className="d-block text-decoration-none text-dark hover-bg-light small mb-1 rounded p-2"
          >
            <i className="fas fa-scroll me-2"></i>
            Sahasranamam Collection
          </Link>
          <Link
            href="/ashtothram"
            className="d-block text-decoration-none text-dark hover-bg-light small mb-1 rounded p-2"
          >
            <i className="fas fa-star me-2"></i>
            Ashtottara Collection
          </Link>
          <Link
            href="/articles"
            className="d-block text-decoration-none text-dark hover-bg-light small mb-1 rounded p-2"
          >
            <i className="fas fa-newspaper me-2"></i>
            Bhakthi Articles
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SearchSidebar;
