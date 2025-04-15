
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import EOQCalculator from "@/components/EOQCalculator";
import { useInventory } from "@/contexts/InventoryContext";

const EOQTab = () => {
  const { 
    inventoryData, 
    handleDistributionOptimization, 
    isCalculating, 
    downloadCsv 
  } = useInventory();

  return (
    <Card>
      <CardHeader>
        <CardTitle>EOQ Analysis</CardTitle>
        <CardDescription>
          Economic Order Quantity results for your inventory
        </CardDescription>
      </CardHeader>
      <CardContent>
        <EOQCalculator data={inventoryData} />
        
        <div className="flex gap-4 mt-6">
          <Button 
            onClick={handleDistributionOptimization} 
            disabled={isCalculating}
            className="bg-blue-600 hover:bg-blue-700"
          >
            🚛 Optimize Distribution
          </Button>
          <Button 
            variant="outline" 
            onClick={downloadCsv}
          >
            💾 Download EOQ Results
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EOQTab;
