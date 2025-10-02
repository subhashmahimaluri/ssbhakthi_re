import { SEARCH_FILTER_OPTIONS } from '@/types/search';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import Select from 'react-select';

type OptionType = {
  value: string;
  label: string;
};

interface SearchBarProps {
  layout?: 'horizontal' | 'vertical'; // horizontal for search page, vertical for sidebar
}

const SearchBox: React.FC<SearchBarProps> = ({ layout = 'horizontal' }) => {
  const router = useRouter();

  const [name, setName] = useState<string>('');
  const [value, setValue] = useState<OptionType | null>(null);
  const [showError, setShowError] = useState<boolean>(false);

  // Populate default values from URL query parameters
  useEffect(() => {
    if (router.isReady) {
      const { keyword, category } = router.query;

      // Set keyword from URL - handle URL encoding properly
      if (keyword && typeof keyword === 'string') {
        const decodedKeyword = decodeURIComponent(keyword.replace(/\+/g, ' '));
        setName(decodedKeyword);
      } else {
        setName('');
      }

      // Set category from URL
      if (category && typeof category === 'string') {
        const categoryOption = SEARCH_FILTER_OPTIONS.find(option => option.value === category);
        setValue(categoryOption || SEARCH_FILTER_OPTIONS[0]); // Default to first option if not found
      } else {
        setValue(SEARCH_FILTER_OPTIONS[0]); // Default to 'All'
      }
    }
  }, [router.isReady, router.query]);

  const onDropdownChange = (selected: OptionType | null) => {
    setValue(selected);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate that keyword is not empty
    if (!name.trim()) {
      setShowError(true);
      // Auto-hide error after 3 seconds
      setTimeout(() => setShowError(false), 3000);
      return;
    }

    const category = value ? value.value : 'All';

    router.push({
      pathname: '/search',
      query: { keyword: name.trim(), category },
    });
  };

  // Define responsive classes based on layout
  const getColumnClasses = () => {
    if (layout === 'vertical') {
      return {
        input: 'col-12 mb-3',
        select: 'col-12 mb-3',
        button: 'col-12',
      };
    }
    return {
      input: 'col-12 col-md-5',
      select: 'col-12 col-md-4',
      button: 'col-12 col-md-3',
    };
  };

  const columnClasses = getColumnClasses();
  const rowClasses = layout === 'vertical' ? 'row g-2' : 'row g-2 align-items-end';

  return (
    <div className="search-box shadow-7 px-4 pb-4 pt-4">
      <form onSubmit={handleSubmit} className="search-form">
        <div className={rowClasses}>
          <div className={columnClasses.input}>
            <div className="form-group position-relative mb-0">
              <input
                className={`form-control gr-text-9 border ${showError ? 'is-invalid' : ''}`}
                type="text"
                id="keyword"
                placeholder="Stotra Name or keyword"
                value={name}
                onChange={e => {
                  setName(e.target.value);
                  // Clear error when user starts typing
                  if (showError) setShowError(false);
                }}
                style={{ minHeight: '50px' }}
              />
              {showError && (
                <div className="invalid-tooltip" style={{ display: 'block' }}>
                  Please enter a keyword to search
                </div>
              )}
            </div>
          </div>
          <div className={columnClasses.select}>
            <Select
              options={SEARCH_FILTER_OPTIONS}
              value={value}
              onChange={onDropdownChange}
              styles={{
                control: provided => ({
                  ...provided,
                  minHeight: '50px',
                  border: '1px solid #ced4da',
                }),
              }}
            />
          </div>
          <div className={columnClasses.button}>
            <button
              type="submit"
              className="btn btn-primary3 w-100 line-height-reset"
              style={{ minHeight: '50px' }}
            >
              Search
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SearchBox;
