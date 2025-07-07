import React from 'react';
import { Search, Filter } from 'lucide-react';
import { prosecutorsData } from '../data/prosecutors';

interface SearchFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedProsecutor: string;
  onProsecutorChange: (value: string) => void;
}

const SearchFilter: React.FC<SearchFilterProps> = ({
  searchTerm,
  onSearchChange,
  selectedProsecutor,
  onProsecutorChange
}) => {
  return (
    <div className="bg-gray-50 p-4 rounded-lg mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Search Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Search size={16} className="inline mr-1" />
            Tìm kiếm vụ án
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo tên vụ án, tội danh, tên bị can..."
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Prosecutor Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Filter size={16} className="inline mr-1" />
            Lọc theo Kiểm sát viên
          </label>
          <select
            value={selectedProsecutor}
            onChange={(e) => onProsecutorChange(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tất cả Kiểm sát viên</option>
            {prosecutorsData.map((prosecutor) => (
              <option key={prosecutor.id} value={prosecutor.name}>
                {prosecutor.name} - {prosecutor.title}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default SearchFilter;