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

  // useEffect để lọc options dựa trên giá trị nhập vào
  useEffect(() => {
    // Nếu giá trị rỗng, hiển thị tất cả options
    if (!value.trim()) {
      setFilteredOptions(options);
    } else {
      // Lọc options dựa trên giá trị nhập vào (không phân biệt hoa thường)
      const filtered = options.filter(option =>
        option.label.toLowerCase().includes(value.toLowerCase()) ||
        option.value.toLowerCase().includes(value.toLowerCase()) ||
        (option.description && option.description.toLowerCase().includes(value.toLowerCase()))
      );
      setFilteredOptions(filtered);
    }
    // Reset highlightedIndex mỗi khi filteredOptions thay đổi
    setHighlightedIndex(-1);
  }, [value, options]); // Phụ thuộc vào value và options

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue); // Cập nhật giá trị lên component cha
    setIsOpen(true); // Luôn mở danh sách khi người dùng nhập liệu
  };

  const handleOptionClick = (option: AutocompleteOption) => {
    onChange(option.value); // Cập nhật giá trị đã chọn
    setIsOpen(false); // Đóng danh sách
    inputRef.current?.blur(); // Ẩn bàn phím ảo trên di động và bỏ focus
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      // Nếu danh sách chưa mở, nhấn ArrowDown hoặc Enter sẽ mở danh sách
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        // Khi mở, luôn hiển thị tất cả options
        setFilteredOptions(options); // <--- THAY ĐỔI Ở ĐÂY
        return;
      }
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault(); // Ngăn cuộn trang
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0 // Di chuyển xuống, vòng lại đầu nếu cuối danh sách
        );
        break;
      case 'ArrowUp':
        e.preventDefault(); // Ngăn cuộn trang
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1 // Di chuyển lên, vòng lại cuối nếu đầu danh sách
        );
        break;
      case 'Enter':
        e.preventDefault(); // Ngăn form submit
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          handleOptionClick(filteredOptions[highlightedIndex]); // Chọn option đang được highlight
        } else if (filteredOptions.length === 1 && value.toLowerCase() === filteredOptions[0].label.toLowerCase()) {
          // Nếu chỉ có một lựa chọn và nó khớp hoàn toàn với giá trị nhập vào, chọn nó
          handleOptionClick(filteredOptions[0]);
        } else {
          // Nếu không có option nào được highlight hoặc không khớp, đóng danh sách
          setIsOpen(false);
          inputRef.current?.blur();
        }
        break;
      case 'Escape':
        setIsOpen(false); // Đóng danh sách
        setHighlightedIndex(-1); // Reset highlight
        inputRef.current?.blur(); // Bỏ focus
        break;
    }
  };

  const handleFocus = () => {
    setIsOpen(true); // Mở danh sách khi input được focus
    // Khi focus, luôn hiển thị tất cả các tùy chọn ban đầu
    setFilteredOptions(options); // <--- THAY ĐỔI Ở ĐÂY
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Sử dụng setTimeout để cho phép sự kiện click trên option được kích hoạt trước khi đóng danh sách
    setTimeout(() => {
      // Kiểm tra xem phần tử đang được focus có nằm trong danh sách gợi ý không
      if (!listRef.current?.contains(document.activeElement)) {
        setIsOpen(false); // Đóng danh sách
        setHighlightedIndex(-1); // Reset highlight
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
              key={`${option.value}-${index}`} // Sử dụng value và index để đảm bảo key duy nhất
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
