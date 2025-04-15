
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { initialInventoryData } from "@/data/sampleData";

interface UploadDataSectionProps {
  onDataUpload: (data: any[]) => void;
}

const UploadDataSection = ({ onDataUpload }: UploadDataSectionProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    setUploadError("");
    
    // In a real application, we would parse the CSV file here
    // For this demo, we'll simulate a file upload with a timeout
    setTimeout(() => {
      try {
        // Simulate successful upload with sample data
        onDataUpload(initialInventoryData);
        setIsUploading(false);
      } catch (error) {
        setUploadError("Failed to parse CSV file. Please check the format.");
        setIsUploading(false);
      }
    }, 1000);
  };
  
  const useSampleData = () => {
    onDataUpload(initialInventoryData);
  };
  
  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700">
          Upload CSV File
        </label>
        <Input
          id="file-upload"
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          disabled={isUploading}
        />
        {isUploading && (
          <p className="text-sm text-blue-600">Uploading and processing file...</p>
        )}
        {uploadError && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{uploadError}</AlertDescription>
          </Alert>
        )}
      </div>
      
      <div className="flex flex-col gap-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-gray-500">Or</span>
          </div>
        </div>
        
        <Button onClick={useSampleData} variant="outline">
          Use Sample Data
        </Button>
      </div>
      
      <Card className="p-4 bg-blue-50 border-blue-200">
        <h3 className="font-medium text-blue-800 mb-2">Expected CSV Format</h3>
        <p className="text-sm text-blue-700">
          Your CSV should include the following columns:
        </p>
        <p className="text-xs text-blue-600 font-mono mt-1">
          item_id, store_id, warehouse_id, demand, order_cost, holding_cost, inventory_level
        </p>
      </Card>
    </div>
  );
};

export default UploadDataSection;
