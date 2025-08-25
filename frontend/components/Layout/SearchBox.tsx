import { useRouter } from 'next/router';
import React, { useState } from 'react';
import Select from 'react-select';

type OptionType = {
  value: string;
  label: string;
};

interface SearchBarProps {
  inputWidth: number;
  selectWidth: number;
  btnWidth: number;
}

const defaultOptions: OptionType[] = [
  { value: 'stotra', label: 'Stotras' },
  { value: 'sahasranama_stotram', label: 'Sahasranama Stotram' },
  { value: 'ashtottara_shatanamavali', label: 'Ashtottara Shatanamavali' },
  { value: 'sahasra_namavali', label: 'Sahasra Namavali' },
  { value: 'article', label: 'Bhakthi Articles' },
  { value: 'calendar', label: 'Telugu Calendar' },
];

const SearchBox: React.FC<SearchBarProps> = ({ inputWidth, selectWidth, btnWidth }) => {
  const router = useRouter();

  const [name, setName] = useState<string>('');
  const [value, setValue] = useState<OptionType | null>(null);

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
        <div className="row mx-n5 justify-content-center">
          <div className={`w-${inputWidth} mb-3 px-3`}>
            <div className="form-group min-height-px-50 mb-0">
              <input
                className="form-control gr-text-9 h-100 border"
                type="text"
                id="keyword"
                placeholder="Stotra Name or keyword"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
          </div>
          <div className={`w-${selectWidth} mb-4 px-3`}>
            <Select options={defaultOptions} value={value} onChange={onDropdownChange} />
          </div>
          <div className={`w-${btnWidth} md-100 px-3`}>
            <button
              type="submit"
              className="btn btn-primary3 w-100 min-height-px-50 line-height-reset"
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
