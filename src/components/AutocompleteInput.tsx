import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';

interface AutocompleteOption {
  value: string;
  label: string;
  description?: string;
}

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  options: AutocompleteOption[];
  placeholder?: string;
  className?: string;
  required?: boolean;
  icon?: React.ReactNode;
}

const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  value,
  onChange,
  options,
  placeholder,
  className = '',
  required = false,
  icon
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<AutocompleteOption[]>(options);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!value.trim()) {
      setFilteredOptions(options);
    } else {
      const filtered = options.filter(option =>
        option.label.toLowerCase().includes(value.toLowerCase()) ||
        option.value.toLowerCase().includes(value.toLowerCase()) ||
        (option.description && option.description.toLowerCase().includes(value.toLowerCase()))
      );
      setFilteredOptions(filtered);
    }
    setHighlightedIndex(-1);
  }, [value, options]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(true);
  };

  const handleOptionClick = (option: AutocompleteOption) => {
    onChange(option.value);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        return;
      }
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          handleOptionClick(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleFocus = () => {
    setIsOpen(true);
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Delay closing to allow option clicks
    setTimeout(() => {
      if (!listRef.current?.contains(document.activeElement)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    }, 150);
  };

  return (
    <div className="relative">
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          required={required}
          className={`w-full ${icon ? 'pl-10' : 'pl-3'} pr-10 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>
      
      {isOpen && filteredOptions.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {filteredOptions.map((option, index) => (
            <li
              key={`${option.value}-${index}`}
              onClick={() => handleOptionClick(option)}
              className={`px-3 py-2 cursor-pointer hover:bg-blue-50 ${
                index === highlightedIndex ? 'bg-blue-50' : ''
              }`}
            >
              <div className="font-medium text-gray-900">{option.label}</div>
              {option.description && (
                <div className="text-sm text-gray-600">{option.description}</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AutocompleteInput;