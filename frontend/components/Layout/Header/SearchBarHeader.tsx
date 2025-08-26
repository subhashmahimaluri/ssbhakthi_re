'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

type Props = {
  mobile?: boolean;
};

export default function SearchBarHeader({ mobile = false }: Props) {
  const router = useRouter();
  const [name, setName] = useState('');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (name.trim()) {
      router.push(`/search?keyword=${encodeURIComponent(name)}&category=All`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="search-form position-relative">
      <input
        className="form-control text-primary gr-text-9 border-bottom-primary search-bar-input"
        type="text"
        id="keyword"
        placeholder="Search"
        value={name}
        onChange={e => setName(e.target.value)}
      />
      {mobile && (
        <button type="submit" className="search-icon-submit" aria-label="Search">
          <i className="gr-text-10 text-primary fa fa-search cursor-pointer"></i>
        </button>
      )}
    </form>
  );
}
