
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DataTable from "@/components/DataTable";
import { useInventory } from "@/contexts/InventoryContext";

const PreviewTab = () => {
  const { inventoryData, handleEOQCalculation, isCalculating, setActiveTab } = useInventory();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Preview</CardTitle>
        <CardDescription>
          Preview of the first few records from your data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable data={inventoryData.slice(0, 10)} />
        
        <div className="flex gap-4 mt-6">
          <Button 
            onClick={handleEOQCalculation} 
            disabled={isCalculating}
            className="bg-blue-600 hover:bg-blue-700"
          >
            🔢 Calculate EOQ
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setActiveTab("upload")}
          >
            Upload Different Data
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PreviewTab;
