"use client";

import React, { useState, useMemo } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { ChevronUp, ChevronDown, Search, Filter, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  data: any[];
  columns: Column[];
  title?: string;
  searchPlaceholder?: string;
  onAdd?: () => void;
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  pageSize?: number;
}

export function DataTable({ 
  data = [], 
  columns = [], 
  title, 
  searchPlaceholder = "Search...", 
  onAdd, 
  onEdit, 
  onDelete,
  pageSize = 10 
}: DataTableProps) {
  const [search, setSearch] = useState('');
  const [sortColumn, setSortColumn] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterColumn, setFilterColumn] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // Apply search filter
    if (search) {
      result = result.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(search.toLowerCase())
        )
      );
    }

    // Apply column filter
    if (filterColumn && filterValue) {
      result = result.filter(row =>
        String(row[filterColumn]).toLowerCase().includes(filterValue.toLowerCase())
      );
    }

    // Apply sorting
    if (sortColumn) {
      result.sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        const direction = sortDirection === 'asc' ? 1 : -1;
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return (aVal - bVal) * direction;
        }
        
        return String(aVal).localeCompare(String(bVal)) * direction;
      });
    }

    return result;
  }, [data, search, sortColumn, sortDirection, filterColumn, filterValue]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAndSortedData.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredAndSortedData.length / pageSize);

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const renderCellContent = (column: Column, row: any) => {
    const value = row[column.key];
    
    if (column.render) {
      return column.render(value, row);
    }
    
    // Auto-render common data types
    if (typeof value === 'boolean') {
      return <Badge variant={value ? 'default' : 'secondary'}>{value ? 'Yes' : 'No'}</Badge>;
    }
    
    if (column.key.includes('status')) {
      const statusColors: Record<string, string> = {
        active: 'bg-green-100 text-green-800',
        inactive: 'bg-red-100 text-red-800',
        pending: 'bg-yellow-100 text-yellow-800',
        optimal: 'bg-green-100 text-green-800',
        warning: 'bg-orange-100 text-orange-800',
        critical: 'bg-red-100 text-red-800',
      };
      return (
        <Badge className={statusColors[value as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
          {value}
        </Badge>
      );
    }
    
    return value;
  };

  return (
    <Card className="p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          {title && <h3 className="text-sm font-semibold text-gray-900">{title}</h3>}
          <p className="text-xs text-gray-500">{filteredAndSortedData.length} records</p>
        </div>
        {onAdd && (
          <Button onClick={onAdd} size="sm" className="bg-green-700 hover:bg-green-800 text-white">
            Add New
          </Button>
        )}
      </div>

      {/* Search and Filter */}
      <div className="flex space-x-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
        
        <Select value={filterColumn} onValueChange={setFilterColumn}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <Filter className="h-3 w-3 mr-1" />
            <SelectValue placeholder="Filter by" />
          </SelectTrigger>
          <SelectContent>
            {columns.filter(col => col.filterable).map(column => (
              <SelectItem key={column.key} value={column.key}>
                {column.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {filterColumn && (
          <Input
            placeholder="Filter value"
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            className="w-32 h-8 text-xs"
          />
        )}
      </div>

      {/* Table */}
      <div className="border border-gray-100 rounded-lg overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr>
              {columns.map(column => (
                <th 
                  key={column.key}
                  className="px-3 py-2 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wider"
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {column.sortable && (
                      <button
                        type="button"
                        onClick={() => handleSort(column.key)}
                        className="p-0.5 hover:bg-gray-200 rounded cursor-pointer"
                      >
                        {sortColumn === column.key ? (
                          sortDirection === 'asc' ? 
                            <ChevronUp className="h-3 w-3 text-green-700" /> : 
                            <ChevronDown className="h-3 w-3 text-green-700" />
                        ) : (
                          <ChevronUp className="h-3 w-3 text-gray-400" />
                        )}
                      </button>
                    )}
                  </div>
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th className="px-3 py-2 text-right text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {paginatedData.map((row, index) => (
              <tr key={row.id || index} className="hover:bg-gray-50/70 transition-colors">
                {columns.map(column => (
                  <td key={column.key} className="px-3 py-2.5 text-xs text-gray-900">
                    {renderCellContent(column, row)}
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td className="px-3 py-2.5 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onEdit && (
                          <DropdownMenuItem onClick={() => onEdit(row)}>
                            Edit
                          </DropdownMenuItem>
                        )}
                        {onDelete && (
                          <DropdownMenuItem onClick={() => onDelete(row)} className="text-red-600">
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                )}
              </tr>
            ))}
            {paginatedData.length === 0 && (
              <tr>
                <td colSpan={columns.length + (onEdit || onDelete ? 1 : 0)} className="px-3 py-8 text-center text-xs text-gray-400">
                  No records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-500">
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredAndSortedData.length)} of {filteredAndSortedData.length} records
          </p>
          <div className="flex space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="h-7 text-xs"
            >
              Previous
            </Button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className={`h-7 w-7 text-xs ${currentPage === page ? 'bg-green-700 text-white' : ''}`}
                >
                  {page}
                </Button>
              );
            })}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="h-7 text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
