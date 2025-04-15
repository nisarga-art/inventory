
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import UploadDataSection from "@/components/UploadDataSection";
import { useInventory } from "@/contexts/InventoryContext";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const UploadTab = () => {
  const { handleDataUpload, inventoryData } = useInventory();

  const downloadProjectConfig = () => {
    // Create a JSON object with the current project configuration
    const projectConfig = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      inventoryData: inventoryData
    };
    
    // Convert to JSON string
    const jsonData = JSON.stringify(projectConfig, null, 2);
    
    // Create a blob and download link
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("download", "supply-chain-project.json");
    a.click();
    
    // Clean up
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Inventory Data</CardTitle>
        <CardDescription>
          Upload a CSV file containing your inventory data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <UploadDataSection onDataUpload={handleDataUpload} />
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h3 className="font-medium text-gray-700 mb-3">Export Project</h3>
          <Button 
            onClick={downloadProjectConfig} 
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
          >
            <Download size={18} />
            Download Project Configuration
          </Button>
          <p className="text-xs text-gray-500 mt-2">
            Save your current project data to continue working in another window or share with colleagues.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default UploadTab;
