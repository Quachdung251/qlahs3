// components/DateInput.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Calendar } from 'lucide-react';
import { parse, format, isValid } from 'date-fns';
import { vi } from 'date-fns/locale';

interface DateInputProps {
  label: string;
  value: string | undefined | null; // Giá trị đầu vào vẫn là dd/MM/yyyy
  onChange: (value: string | undefined) => void; // Hàm onChange sẽ trả về dd/MM/yyyy hoặc undefined
  required?: boolean;
  className?: string;
  name?: string;
}

const DateInput: React.FC<DateInputProps> = ({ label, value, onChange, required, className, name }) => {
  const [dayInput, setDayInput] = useState<string>('');
  const [monthInput, setMonthInput] = useState<string>('');
  const [yearInput, setYearInput] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // --- Bỏ các state và ref liên quan đến dropdown ---
  // const [showDayDropdown, setShowDayDropdown] = useState<boolean>(false);
  // const [showMonthDropdown, setShowMonthDropdown] = useState<boolean>(false);
  // const dayDropdownRef = useRef<HTMLDivElement>(null);
  // const monthDropdownRef = useRef<HTMLDivElement>(null);

  const dayRef = useRef<HTMLInputElement>(null);
  const monthRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);

  const acceptedParseFormats = [
    'dd/MM/yyyy', 'd/M/yyyy', 'dd-MM-yyyy', 'd-M/yyyy', 'dd.MM.yyyy', 'd.M.yyyy',
    'dd/MM/yy', 'd/M/yy', 'dd-MM-yy', 'd-M-yy', 'dd.MM.yy', 'd.M.yy',
    'ddMMyyyy', 'dMMyyyy',
    'ddMM', 'dMM',
  ];

  const currentYear = new Date().getFullYear().toString();

  const padSingleDigitForParse = (numStr: string): string => {
    if (numStr.length === 1 && numStr !== '') {
      return '0' + numStr;
    }
    return numStr;
  };

  const removeLeadingZeroForDisplay = (numStr: string): string => {
    if (numStr === '00') {
        return '00';
    }
    if (numStr.length === 2 && numStr.startsWith('0')) {
        return numStr.substring(1);
    }
    return numStr;
  };

  useEffect(() => {
    if (value) {
      const parsedDate = parse(value, 'dd/MM/yyyy', new Date(), { locale: vi });
      if (isValid(parsedDate)) {
        setDayInput(removeLeadingZeroForDisplay(format(parsedDate, 'dd', { locale: vi })));
        setMonthInput(removeLeadingZeroForDisplay(format(parsedDate, 'MM', { locale: vi })));
        setYearInput(format(parsedDate, 'yyyy', { locale: vi }));
        setError(null);
      } else {
        setDayInput('');
        setMonthInput('');
        setYearInput(currentYear);
        setError('Ngày tháng không hợp lệ từ dữ liệu ban đầu.');
      }
    } else {
      setDayInput('');
      setMonthInput('');
      setYearInput(currentYear);
      setError(null);
    }
  }, [value, currentYear]);

  // --- Bỏ useEffect xử lý click ngoài dropdown ---
  // useEffect(() => {
  //   const handleClickOutside = (event: MouseEvent) => { /* ... */ };
  //   document.addEventListener('mousedown', handleClickOutside);
  //   return () => document.removeEventListener('mousedown', handleClickOutside);
  // }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'day' | 'month' | 'year') => {
    let inputValue = e.target.value.replace(/[^0-9]/g, '');

    if (type === 'day') {
      setDayInput(inputValue);
      // Giữ logic chuyển focus
      if (inputValue.length === 2 && monthRef.current) {
        setTimeout(() => {
          monthRef.current?.focus();
        }, 0);
      }
    } else if (type === 'month') {
      setMonthInput(inputValue);
      // Giữ logic chuyển focus
      if (inputValue.length === 2 && yearRef.current) {
        setTimeout(() => {
          yearRef.current?.focus();
        }, 0);
      }
    } else if (type === 'year') {
      setYearInput(inputValue);
    }
  };

  // --- Bỏ hàm handleSelectFromDropdown ---
  // const handleSelectFromDropdown = (type: 'day' | 'month', selectedValue: string) => { /* ... */ };

  const validateAndFormatAndPropagate = useCallback(() => {
    let d = dayInput.trim();
    let m = monthInput.trim();
    let y = yearInput.trim();

    setError(null);

    if (!d && !m && !y) {
      onChange(undefined);
      setDayInput('');
      setMonthInput('');
      setYearInput(currentYear);
      return;
    }

    const dayNum = parseInt(d, 10);
    const monthNum = parseInt(m, 10);
    const yearNum = parseInt(y, 10);

    let tempError: string | null = null;

    if (d && (isNaN(dayNum) || dayNum < 1 || dayNum > 31)) {
        tempError = 'Ngày không hợp lệ (1-31).';
    } else if (m && (isNaN(monthNum) || monthNum < 1 || monthNum > 12)) {
        tempError = 'Tháng không hợp lệ (1-12).';
    } else if (y && (isNaN(yearNum) || y.length < 2 || y.length > 4)) {
        tempError = 'Năm không hợp lệ.';
    }

    const dayForParse = padSingleDigitForParse(d);
    const monthForParse = padSingleDigitForParse(m);
    let yearForParse = y;

    let finalYearNum = parseInt(yearForParse, 10);
    if (yearForParse.length === 2 && finalYearNum < 100) {
        finalYearNum += 2000;
        yearForParse = finalYearNum.toString();
    } else if (yearForParse.length === 0) {
        yearForParse = currentYear;
    }

    const combinedInput = `${dayForParse}/${monthForParse}/${yearForParse}`;
    
    let parsedDate: Date | null = null;
    for (const fmt of acceptedParseFormats) {
        const attemptParse = parse(combinedInput, fmt, new Date(), { locale: vi });
        if (isValid(attemptParse)) {
            parsedDate = attemptParse;
            break;
        }
    }

    if (parsedDate && isValid(parsedDate)) {
      setDayInput(removeLeadingZeroForDisplay(format(parsedDate, 'dd', { locale: vi })));
      setMonthInput(removeLeadingZeroForDisplay(format(parsedDate, 'MM', { locale: vi })));
      setYearInput(format(parsedDate, 'yyyy', { locale: vi }));

      onChange(format(parsedDate, 'dd/MM/yyyy', { locale: vi }));
      setError(null);
    } else {
      if (tempError) {
          setError(tempError);
      } else {
          const isDayFilled = d.length > 0;
          const isMonthFilled = m.length > 0;
          const isYearFilled = y.length > 0;

          const hasEnoughInfoForComprehensiveError = 
            (isDayFilled && isMonthFilled && isYearFilled && d.length >= 1 && m.length >= 1 && y.length >= 2) ||
            (isDayFilled && isMonthFilled && y.length === 0 && d.length >= 1 && m.length >= 1);

          if (hasEnoughInfoForComprehensiveError) {
              setError('Ngày tháng không hợp lệ. Vui lòng kiểm tra lại.');
          } else {
              setError(null);
          }
      }
      onChange(undefined);
    }
  }, [dayInput, monthInput, yearInput, onChange, currentYear, acceptedParseFormats]);

  const handleBlur = () => {
    // Chỉ validate khi blur, không cần ẩn dropdown nữa
    validateAndFormatAndPropagate();
  };

  const handleFocus = (type: 'day' | 'month' | 'year') => {
    // Không cần set showDropdown state nữa
    // Logic focus tự nhiên của input là đủ
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      validateAndFormatAndPropagate();
    }
  };

  // --- Bỏ các hàm và biến tạo dropdown data ---
  // const generateNumbersForDropdown = (start: number, end: number): string[] => { /* ... */ };
  // const dayNumbers = generateNumbersForDropdown(1, 31);
  // const monthNumbers = generateNumbersForDropdown(1, 12);

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        <Calendar size={16} className="inline mr-1" />
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex space-x-2">
        {/* Day Input */}
        <div className="relative w-1/3">
          <input
            type="text"
            placeholder="DD"
            value={dayInput}
            onChange={(e) => handleInputChange(e, 'day')}
            onBlur={handleBlur}
            onFocus={() => handleFocus('day')}
            onKeyDown={handleKeyDown}
            maxLength={2}
            ref={dayRef}
            className={`w-full p-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            required={required}
          />
          {/* --- Bỏ JSX của dropdown ngày --- */}
        </div>

        {/* Month Input */}
        <div className="relative w-1/3">
          <input
            type="text"
            placeholder="MM"
            value={monthInput}
            onChange={(e) => handleInputChange(e, 'month')}
            onBlur={handleBlur}
            onFocus={() => handleFocus('month')}
            onKeyDown={handleKeyDown}
            maxLength={2}
            ref={monthRef}
            className={`w-full p-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            required={required}
          />
          {/* --- Bỏ JSX của dropdown tháng --- */}
        </div>

        {/* Year Input */}
        <div className="w-1/3">
          <input
            type="text"
            placeholder="YYYY"
            value={yearInput}
            onChange={(e) => handleInputChange(e, 'year')}
            onBlur={handleBlur}
            onFocus={() => handleFocus('year')}
            onKeyDown={handleKeyDown}
            maxLength={4}
            ref={yearRef}
            className={`w-full p-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            required={required}
          />
        </div>
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default DateInput;