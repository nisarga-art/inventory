
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DistributionOptimizer from "@/components/DistributionOptimizer";
import { useInventory } from "@/contexts/InventoryContext";

const DistributionTab = () => {
  const { optimizedData, downloadCsv, setActiveTab } = useInventory();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribution Network Optimization</CardTitle>
        <CardDescription>
          Optimized distribution plan for your supply chain
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DistributionOptimizer data={optimizedData} />
        
        <div className="flex gap-4 mt-6">
          <Button 
            onClick={downloadCsv}
            className="bg-blue-600 hover:bg-blue-700"
          >
            💾 Download Optimized Plan
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setActiveTab("upload")}
          >
            Start New Analysis
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DistributionTab;
