'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

type Props = {
  mobile?: boolean;
  onSearchSubmit?: () => void; // Callback when search is successfully submitted
};

export default function SearchBarHeader({ mobile = false, onSearchSubmit }: Props) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [showError, setShowError] = useState(false);

  const handleSearchClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Validate that keyword is not empty
    if (!name.trim()) {
      setShowError(true);
      // Auto-hide error after 3 seconds
      setTimeout(() => setShowError(false), 3000);
      return;
    }

    router.push(`/search?keyword=${encodeURIComponent(name.trim())}&category=All`);

    // Clear the search input
    setName('');

    // Notify parent component that search was submitted successfully
    if (onSearchSubmit) {
      onSearchSubmit();
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate that keyword is not empty
    if (!name.trim()) {
      setShowError(true);
      // Auto-hide error after 3 seconds
      setTimeout(() => setShowError(false), 3000);
      return;
    }

    router.push(`/search?keyword=${encodeURIComponent(name.trim())}&category=All`);

    // Clear the search input
    setName('');

    // Notify parent component that search was submitted successfully
    if (onSearchSubmit) {
      onSearchSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="search-form position-relative">
      <div className="input-group">
        <input
          className={`form-control text-primary gr-text-9 border-bottom-primary search-bar-input ${showError ? 'is-invalid' : ''}`}
          type="text"
          id="keyword"
          placeholder="Search"
          value={name}
          onChange={e => {
            setName(e.target.value);
            // Clear error when user starts typing
            if (showError) setShowError(false);
          }}
        />
        {/* Always show search button inside input group */}
        <button
          type="button"
          className="btn btn-outline-primary search-submit-btn"
          onClick={handleSearchClick}
          aria-label="Search"
          style={{
            borderLeft: 'none',
            borderTopLeftRadius: 0,
            borderBottomLeftRadius: 0,
            paddingLeft: '12px',
            paddingRight: '12px',
            height: '100%',
          }}
        >
          <i className="fa fa-search"></i>
        </button>
      </div>

      {showError && (
        <div className="invalid-tooltip" style={{ display: 'block', fontSize: '12px' }}>
          Please enter a keyword to search
        </div>
      )}

      {/* Keep mobile button for backward compatibility but make it also submit */}
      {mobile && (
        <button
          type="button"
          className="search-icon-submit"
          aria-label="Search"
          onClick={handleSearchClick}
        >
          <i className="gr-text-10 text-primary fa fa-search cursor-pointer"></i>
        </button>
      )}
    </form>
  );
}
