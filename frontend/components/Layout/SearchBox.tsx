import { SEARCH_FILTER_OPTIONS } from '@/types/search';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import Select from 'react-select';

type OptionType = {
  value: string;
  label: string;
};

interface SearchBarProps {
  // No specific width props needed - using responsive Bootstrap grid
}

const SearchBox: React.FC<SearchBarProps> = () => {
  const router = useRouter();

  const [name, setName] = useState<string>('');
  const [value, setValue] = useState<OptionType | null>(null);

  // Populate default values from URL query parameters
  useEffect(() => {
    if (router.isReady) {
      const { keyword, category } = router.query;

      // Set keyword from URL
      if (keyword && typeof keyword === 'string') {
        setName(decodeURIComponent(keyword));
      }

      // Set category from URL
      if (category && typeof category === 'string') {
        const categoryOption = SEARCH_FILTER_OPTIONS.find(option => option.value === category);
        if (categoryOption) {
          setValue(categoryOption);
        }
      }
    }
  }, [router.isReady, router.query]);

  const onDropdownChange = (selected: OptionType | null) => {
    setValue(selected);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const category = value ? value.value : 'All';

    if (name || value) {
      router.push({
        pathname: '/search',
        query: { keyword: name, category },
      });
    }
  };

  return (
    <div className="search-box shadow-7 px-4 pb-4 pt-4">
      <form onSubmit={handleSubmit} className="search-form">
        <div className="row g-2 align-items-end">
          <div className="col-12 col-md-5">
            <div className="form-group mb-0">
              <input
                className="form-control gr-text-9 border"
                type="text"
                id="keyword"
                placeholder="Stotra Name or keyword"
                value={name}
                onChange={e => setName(e.target.value)}
                style={{ minHeight: '50px' }}
              />
            </div>
          </div>
          <div className="col-12 col-md-4">
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
          <div className="col-12 col-md-3">
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
