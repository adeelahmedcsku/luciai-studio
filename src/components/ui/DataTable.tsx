import React, { useState, useMemo } from 'react';

export interface Column<T = any> {
  key: string;
  header: string;
  width?: string | number;
  sortable?: boolean;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T = any> {
  data: T[];
  columns: Column<T>[];
  keyField?: string;
  onRowClick?: (row: T, index: number) => void;
  onRowDoubleClick?: (row: T, index: number) => void;
  selectedRowIndex?: number;
  pagination?: boolean;
  pageSize?: number;
  searchable?: boolean;
  searchPlaceholder?: string;
  striped?: boolean;
  hoverable?: boolean;
  bordered?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export const DataTable = <T extends Record<string, any>>({
  data,
  columns,
  keyField = 'id',
  onRowClick,
  onRowDoubleClick,
  selectedRowIndex,
  pagination = false,
  pageSize = 10,
  searchable = false,
  searchPlaceholder = 'Search...',
  striped = true,
  hoverable = true,
  bordered = true,
  loading = false,
  emptyMessage = 'No data available',
  className = '',
}: DataTableProps<T>) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  
  // Search filtering
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter(row =>
      Object.values(row).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);
  
  // Sorting
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);
  
  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = pagination
    ? sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : sortedData;
  
  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (!current || current.key !== key) {
        return { key, direction: 'asc' };
      }
      if (current.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return null;
    });
  };
  
  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };
  
  const getAlignClass = (align?: 'left' | 'center' | 'right') => {
    switch (align) {
      case 'center': return 'text-center';
      case 'right': return 'text-right';
      default: return 'text-left';
    }
  };
  
  return (
    <div className={`data-table-container ${className}`}>
      {/* Search Bar */}
      {searchable && (
        <div className="mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>
      )}
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className={`min-w-full ${bordered ? 'border border-gray-200' : ''}`}>
          {/* Header */}
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`
                    px-4 py-3 text-sm font-semibold text-gray-700
                    ${getAlignClass(column.align)}
                    ${bordered ? 'border-b border-gray-200' : ''}
                    ${column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''}
                  `}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    <span>{column.header}</span>
                    {column.sortable && (
                      <span className="inline-flex">
                        {sortConfig?.key === column.key ? (
                          sortConfig.direction === 'asc' ? (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h7a1 1 0 100-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h5a1 1 0 000-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM13 16a1 1 0 102 0v-5.586l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 101.414 1.414L13 10.414V16z" />
                            </svg>
                          )
                        ) : (
                          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M5 12a1 1 0 102 0V6.414l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L5 6.414V12zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z" />
                          </svg>
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          
          {/* Body */}
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Loading...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => {
                const actualIndex = pagination ? (currentPage - 1) * pageSize + rowIndex : rowIndex;
                const isSelected = selectedRowIndex === actualIndex;
                
                return (
                  <tr
                    key={row[keyField] || rowIndex}
                    className={`
                      ${striped && rowIndex % 2 === 1 ? 'bg-gray-50' : 'bg-white'}
                      ${hoverable ? 'hover:bg-blue-50' : ''}
                      ${isSelected ? 'bg-blue-100' : ''}
                      ${onRowClick || onRowDoubleClick ? 'cursor-pointer' : ''}
                      transition-colors duration-150
                    `}
                    onClick={() => onRowClick?.(row, actualIndex)}
                    onDoubleClick={() => onRowDoubleClick?.(row, actualIndex)}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`
                          px-4 py-3 text-sm text-gray-900
                          ${getAlignClass(column.align)}
                          ${bordered ? 'border-b border-gray-200' : ''}
                        `}
                      >
                        {column.render
                          ? column.render(row[column.key], row, actualIndex)
                          : row[column.key]}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-700">
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} results
          </div>
          
          <div className="flex gap-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`
                    px-3 py-1 border rounded
                    ${currentPage === pageNum
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 hover:bg-gray-50'}
                  `}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Example usage:
/*
const columns: Column[] = [
  { key: 'id', header: 'ID', width: 80, sortable: true },
  { key: 'name', header: 'Name', sortable: true },
  { key: 'email', header: 'Email', sortable: true },
  {
    key: 'status',
    header: 'Status',
    align: 'center',
    render: (value) => (
      <span className={`px-2 py-1 rounded ${value === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
        {value}
      </span>
    ),
  },
  {
    key: 'actions',
    header: 'Actions',
    align: 'center',
    render: (_, row) => (
      <button onClick={() => console.log('Edit', row)}>Edit</button>
    ),
  },
];

<DataTable
  data={users}
  columns={columns}
  pagination
  pageSize={10}
  searchable
  striped
  hoverable
  onRowClick={(row) => console.log('Clicked:', row)}
/>
*/
