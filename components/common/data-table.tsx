import { ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Download, Filter } from "lucide-react";

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: any) => ReactNode;
}

interface DataTableProps {
  title: string;
  data: any[];
  columns: Column[];
  searchPlaceholder?: string;
  actions?: ReactNode;
  filters?: {
    key: string;
    label: string;
    options: { value: string; label: string }[];
  }[];
  onExportCSV?: () => void;
}

export function DataTable({
  title,
  data,
  columns,
  searchPlaceholder = "Pesquisar...",
  actions,
  filters = [],
  onExportCSV,
}: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  // Filter and search data
  const filteredData = data.filter((item) => {
    // Search filter
    const searchMatch = Object.values(item)
      .some((value) =>
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );

    // Additional filters
    const filterMatch = Object.entries(filterValues).every(([key, value]) => {
      if (!value) return true;
      return item[key]?.toString() === value;
    });

    return searchMatch && filterMatch;
  });

  // Sort data
  const sortedData = [...filteredData];
  if (sortConfig) {
    sortedData.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const exportToCSV = () => {
    const headers = columns.map(col => col.label).join(",");
    const rows = sortedData.map(row => 
      columns.map(col => {
        const value = row[col.key];
        return typeof value === "string" && value.includes(",") ? `"${value}"` : value;
      }).join(",")
    );
    
    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${title.toLowerCase().replace(/\s+/g, "-")}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
    onExportCSV?.();
  };

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg sm:text-xl">{title}</CardTitle>
          <div className="flex flex-col sm:flex-row gap-2">
            {actions}
            <Button variant="outline" size="sm" onClick={exportToCSV} className="w-full sm:w-auto">
              <Download className="h-4 w-4 mr-2" />
              <span className="sm:inline">Exportar CSV</span>
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {filters.map((filter) => (
            <Select
              key={filter.key}
              value={filterValues[filter.key] || "all"}
              onValueChange={(value) =>
                setFilterValues(prev => ({ 
                  ...prev, 
                  [filter.key]: value === "all" ? "" : value 
                }))
              }
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder={filter.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {filter.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead
                    key={column.key}
                    className={`whitespace-nowrap ${column.sortable ? "cursor-pointer hover:bg-muted/50" : ""}`}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-xs sm:text-sm">{column.label}</span>
                      {column.sortable && sortConfig?.key === column.key && (
                        <span className="text-xs">
                          {sortConfig.direction === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center py-8">
                    <div className="text-sm text-muted-foreground">
                      Nenhum resultado encontrado
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                sortedData.map((row, index) => (
                  <TableRow key={index}>
                    {columns.map((column) => (
                      <TableCell key={column.key} className="whitespace-nowrap text-xs sm:text-sm">
                        {column.render
                          ? column.render(row[column.key], row)
                          : row[column.key]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {sortedData.length > 0 && (
          <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
            <span>
              Mostrando {sortedData.length} de {data.length} resultados
            </span>
            {(searchTerm || Object.values(filterValues).some(v => v)) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setFilterValues({});
                }}
              >
                Limpar filtros
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}