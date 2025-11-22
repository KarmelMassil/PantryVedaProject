"use client";
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Filter as FilterIcon, ArrowUpDown } from 'lucide-react';

export type SortOption = {
  group: string;
  value: string;
  label: string;
  icon: React.ElementType;
};

type FilterAndSortProps = {
  sortOptions: SortOption[];
  sortBy: string;
  setSortBy: (value: string) => void;
  filterContent?: React.ReactNode;
  activeFilterCount?: number;
};

export function FilterAndSort({
  sortOptions,
  sortBy,
  setSortBy,
  filterContent,
  activeFilterCount,
}: FilterAndSortProps) {
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const renderSortOption = (option: SortOption) => {
    const Icon = option.icon;
    return (
      <li
        key={option.value}
        className={`px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer flex items-center gap-2 ${
          sortBy === option.value ? 'bg-blue-500 text-white hover:bg-blue-600' : ''
        }`}
        onMouseDown={() => {
          setSortBy(option.value);
          setIsSortOpen(false);
        }}
      >
        <Icon size={16} className={sortBy === option.value ? 'text-white' : 'text-gray-500'} />
        {option.label}
      </li>
    );
  };

  const currentSortLabel = sortOptions.find((opt) => opt.value === sortBy)?.label || 'Sort';

  return (
    <div className="flex items-center gap-2">
      {/* Sort Button and Dropdown */}
      <div className="relative" ref={sortRef}>
        <button
          onClick={() => setIsSortOpen(!isSortOpen)}
          className="flex items-center gap-2 p-2 border rounded-md text-sm text-gray-700 hover:bg-gray-100"
        >
          <ArrowUpDown size={16} />
          <span>{currentSortLabel}</span>
          <ChevronDown size={16} className={`transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
        </button>
        {isSortOpen && (
          <ul
            data-testid="sort-options"
            className="absolute z-20 mt-1 w-64 bg-white border rounded-md shadow-lg max-h-80 overflow-auto right-0"
          >
            {sortOptions.reduce((acc, option, index) => {
              const prevOption = index > 0 ? sortOptions[index - 1] : null;
              if (!prevOption || prevOption.group !== option.group) {
                acc.push(
                  <li key={option.group} className="px-3 py-2 text-xs font-bold text-gray-500 uppercase bg-gray-50">
                    {option.group}
                  </li>
                );
              }
              acc.push(renderSortOption(option));
              return acc;
            }, [] as React.ReactNode[])}
          </ul>
        )}
      </div>

      {/* Filter Button and Popover */}
      {filterContent && (
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="relative flex items-center gap-2 p-2 border rounded-md text-sm text-gray-700 hover:bg-gray-100"
          >
            <FilterIcon size={16} />
            <span>Filter</span>
            {activeFilterCount && activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-white text-xs">
                {activeFilterCount}
              </span>
            )}
          </button>
          {isFilterOpen && (
            <div
              data-testid="filter-popover"
              className="absolute z-20 mt-1 w-72 bg-white border rounded-md shadow-lg right-0"
              onClick={(e) => e.stopPropagation()} // Prevents closing when clicking inside popover
            >
              <div className="p-4">
                {filterContent}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
