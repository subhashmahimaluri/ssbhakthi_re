import { useTranslation } from '@/hooks/useTranslation';
import { FestivalCategory, getFestivalCategories, TELUGU_MONTHS } from '@/lib/festivalData';
import { useState } from 'react';
import { Badge, Button, Col, Form, InputGroup, Row } from 'react-bootstrap';

interface FestivalSearchProps {
  searchTerm: string;
  selectedCategory: FestivalCategory | 'All';
  selectedMonth: string;
  onSearchChange: (term: string) => void;
  onCategoryChange: (category: FestivalCategory | 'All') => void;
  onMonthChange: (month: string) => void;
  festivalCount: number;
  totalCount: number;
}

const FestivalSearch: React.FC<FestivalSearchProps> = ({
  searchTerm,
  selectedCategory,
  selectedMonth,
  onSearchChange,
  onCategoryChange,
  onMonthChange,
  festivalCount,
  totalCount,
}) => {
  const { t, locale } = useTranslation();
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  const categories = getFestivalCategories();
  const months = Object.keys(TELUGU_MONTHS);

  const clearAllFilters = () => {
    onSearchChange('');
    onCategoryChange('All');
    onMonthChange('All');
  };

  const hasActiveFilters = searchTerm || selectedCategory !== 'All' || selectedMonth !== 'All';

  return (
    <div className="festival-search-container mb-4">
      <div className="search-header rounded-top border-bottom bg-white p-4">
        <Row className="align-items-center">
          <Col xs={12} md={8}>
            <h4 className="search-title mb-md-0 mb-3">
              {locale === 'te' ? 'పండుగలను వెతకండి' : 'Search Festivals'}
            </h4>
          </Col>
          <Col xs={12} md={4} className="text-md-end">
            <div className="results-count">
              <span className="count-badge badge bg-primary">
                {festivalCount} {locale === 'te' ? 'లో' : 'of'} {totalCount}
              </span>
            </div>
          </Col>
        </Row>
      </div>

      <div className="search-content bg-white p-4">
        {/* Search Input */}
        <Row className="mb-3">
          <Col xs={12}>
            <InputGroup size="lg">
              <InputGroup.Text>
                <i className="bi bi-search"></i>
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder={
                  locale === 'te'
                    ? 'పండుగ పేరు, వర్ణన లేదా తిథి వెతకండి...'
                    : 'Search by festival name, description, or tithi...'
                }
                value={searchTerm}
                onChange={e => onSearchChange(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <Button
                  variant="outline-secondary"
                  onClick={() => onSearchChange('')}
                  className="clear-search-btn"
                >
                  ×
                </Button>
              )}
            </InputGroup>
          </Col>
        </Row>

        {/* Quick Filter Toggle */}
        <Row className="mb-3">
          <Col xs={12}>
            <div className="d-flex justify-content-between align-items-center">
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                className="filter-toggle-btn"
              >
                <i className={`bi bi-funnel${isFilterExpanded ? '-fill' : ''} me-2`}></i>
                {locale === 'te' ? 'వడపోత' : 'Filters'}
                <i className={`bi bi-chevron-${isFilterExpanded ? 'up' : 'down'} ms-2`}></i>
              </Button>

              {hasActiveFilters && (
                <div className="active-filters d-flex align-items-center gap-2">
                  <Button
                    variant="link"
                    size="sm"
                    onClick={clearAllFilters}
                    className="clear-all-btn text-decoration-none"
                  >
                    {locale === 'te' ? 'అన్నీ క్లియర్ చేయండి' : 'Clear All'}
                  </Button>
                </div>
              )}
            </div>
          </Col>
        </Row>

        {/* Expandable Filters */}
        {isFilterExpanded && (
          <div className="filters-expanded">
            <Row>
              {/* Category Filter */}
              <Col xs={12} md={6} className="mb-3">
                <Form.Label className="filter-label fw-bold">
                  {locale === 'te' ? 'వర్గం' : 'Category'}
                </Form.Label>
                <Form.Select
                  value={selectedCategory}
                  onChange={e => onCategoryChange(e.target.value as FestivalCategory | 'All')}
                  className="category-select"
                >
                  <option value="All">
                    {locale === 'te' ? 'అన్ని వర్గాలు' : 'All Categories'}
                  </option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </Form.Select>
              </Col>

              {/* Month Filter */}
              <Col xs={12} md={6} className="mb-3">
                <Form.Label className="filter-label fw-bold">
                  {locale === 'te' ? 'మాసం' : 'Month'}
                </Form.Label>
                <Form.Select
                  value={selectedMonth}
                  onChange={e => onMonthChange(e.target.value)}
                  className="month-select"
                >
                  <option value="All">{locale === 'te' ? 'అన్ని మాసాలు' : 'All Months'}</option>
                  {months.map(month => (
                    <option key={month} value={month}>
                      {locale === 'te' ? TELUGU_MONTHS[month as keyof typeof TELUGU_MONTHS] : month}
                    </option>
                  ))}
                </Form.Select>
              </Col>
            </Row>
          </div>
        )}

        {/* Active Filter Badges */}
        {hasActiveFilters && (
          <Row>
            <Col xs={12}>
              <div className="active-filter-badges d-flex border-top flex-wrap gap-2 pt-3">
                <small className="text-muted me-2">
                  {locale === 'te' ? 'సక్రియ వడపోతలు:' : 'Active Filters:'}
                </small>

                {searchTerm && (
                  <Badge
                    bg="info"
                    className="filter-badge"
                    role="button"
                    onClick={() => onSearchChange('')}
                  >
                    {locale === 'te' ? 'వెతుకు:' : 'Search:'} "{searchTerm}" ×
                  </Badge>
                )}

                {selectedCategory !== 'All' && (
                  <Badge
                    bg="success"
                    className="filter-badge"
                    role="button"
                    onClick={() => onCategoryChange('All')}
                  >
                    {selectedCategory} ×
                  </Badge>
                )}

                {selectedMonth !== 'All' && (
                  <Badge
                    bg="warning"
                    className="filter-badge"
                    role="button"
                    onClick={() => onMonthChange('All')}
                  >
                    {locale === 'te'
                      ? TELUGU_MONTHS[selectedMonth as keyof typeof TELUGU_MONTHS]
                      : selectedMonth}{' '}
                    ×
                  </Badge>
                )}
              </div>
            </Col>
          </Row>
        )}
      </div>

      <style jsx>{`
        .festival-search-container {
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          border-radius: 12px;
          overflow: hidden;
          background: white;
        }

        .search-title {
          color: #2c3e50;
          font-weight: 700;
        }

        .count-badge {
          font-size: 1em;
          padding: 8px 16px;
          border-radius: 20px;
        }

        .search-input {
          border: 2px solid #e9ecef;
          transition: all 0.3s ease;
          font-size: 1.1em;
        }

        .search-input:focus {
          border-color: #007bff;
          box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
        }

        .clear-search-btn {
          border: none;
          background: transparent;
          font-size: 1.5em;
          color: #6c757d;
          padding: 8px 12px;
        }

        .clear-search-btn:hover {
          color: #dc3545;
          background: #f8f9fa;
        }

        .filter-toggle-btn {
          border: 2px solid var(--bs-primary);
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .filter-toggle-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 123, 255, 0.2);
        }

        .clear-all-btn {
          color: #dc3545 !important;
          font-weight: 600;
          padding: 4px 8px;
        }

        .clear-all-btn:hover {
          color: #a71d2a !important;
          text-decoration: underline !important;
        }

        .filters-expanded {
          animation: slideDown 0.3s ease-out;
          background: #f8f9fa;
          padding: 1.5rem;
          border-radius: 8px;
          margin-top: 1rem;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            max-height: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            max-height: 200px;
            transform: translateY(0);
          }
        }

        .filter-label {
          color: #495057;
          margin-bottom: 8px;
          font-size: 0.95em;
        }

        .category-select,
        .month-select {
          border: 2px solid #e9ecef;
          transition: all 0.3s ease;
        }

        .category-select:focus,
        .month-select:focus {
          border-color: #007bff;
          box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
        }

        .filter-badge {
          cursor: pointer;
          transition: all 0.3s ease;
          padding: 6px 12px;
          font-size: 0.85em;
        }

        .filter-badge:hover {
          transform: scale(1.05);
          opacity: 0.8;
        }

        .active-filter-badges {
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Mobile Responsiveness */
        @media (max-width: 768px) {
          .search-content {
            padding: 1rem !important;
          }

          .filters-expanded {
            padding: 1rem;
          }

          .filter-badge {
            font-size: 0.8em;
            margin-bottom: 0.5rem;
          }

          .active-filter-badges {
            flex-direction: column;
            align-items: flex-start !important;
          }
        }

        /* Accessibility */
        .filter-badge:focus {
          outline: 2px solid var(--bs-primary);
          outline-offset: 2px;
        }

        .search-input:focus-visible {
          outline: none;
        }
      `}</style>
    </div>
  );
};

export default FestivalSearch;
