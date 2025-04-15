
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, Search, ArrowLeft, ArrowRight } from "lucide-react";

interface DataTableProps {
  data: Record<string, any>[];
}

const DataTable = ({ data }: DataTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  if (!data || data.length === 0) {
    return <div className="text-center py-4">No data available</div>;
  }

  // Get column headers from first data item
  const columns = Object.keys(data[0]);

  // Filter data based on search term
  const filteredData = data.filter((row) => {
    return Object.values(row).some((value) => 
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  // Handle page change
  const goToPage = (pageNumber: number) => {
    setCurrentPage(Math.max(1, Math.min(pageNumber, totalPages)));
  };

  // Handle CSV export
  const exportToCsv = () => {
    const headers = columns.join(",");
    const csvData = filteredData.map(row => 
      columns.map(column => {
        const value = row[column];
        // Handle values with commas by quoting them
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value;
      }).join(",")
    ).join("\n");
    
    const csv = `${headers}\n${csvData}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("download", "supply_chain_data.csv");
    a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search data..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={exportToCsv}
          className="flex items-center gap-1"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="border rounded-md overflow-auto max-h-[400px]">
        <Table>
          <TableHeader className="bg-blue-50 sticky top-0">
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column} className="whitespace-nowrap font-semibold">
                  {column.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.map((row, index) => (
              <TableRow key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                {columns.map((column) => (
                  <TableCell key={`${index}-${column}`} className="whitespace-nowrap">
                    {typeof row[column] === 'number' && !Number.isInteger(row[column]) 
                      ? row[column].toFixed(2) 
                      : row[column]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length} items
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
