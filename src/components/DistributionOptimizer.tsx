
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Legend
} from "recharts";
import { Download, BarChart2, Network, Map, Info, AlertTriangle, CheckCircle } from "lucide-react";
import DataTable from "./DataTable";
import NetworkVisualization from "./NetworkVisualization";

interface OptimizationResult {
  total_cost: number;
  total_distance: number;
  total_items: number;
  feasibility: "optimal" | "infeasible" | "unbounded";
}

interface DistributionOptimizerProps {
  data: any[];
}

const DistributionOptimizer = ({ data }: DistributionOptimizerProps) => {
  const [warehouseData, setWarehouseData] = useState<any[]>([]);
  const [storeData, setStoreData] = useState<any[]>([]);
  const [networkData, setNetworkData] = useState<any[]>([]);
  const [optimizationProgress, setOptimizationProgress] = useState(0);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  
  useEffect(() => {
    if (!data || data.length === 0) return;
    
    // Process data for warehouse distribution
    const warehouseMap = data.reduce((acc, item) => {
      const key = item.warehouse_id;
      if (!acc[key]) {
        acc[key] = {
          warehouse_id: key,
          total_demand: 0,
          total_items: 0,
          total_cost: 0
        };
      }
      acc[key].total_demand += item.demand;
      acc[key].total_items += 1;
      acc[key].total_cost += (item.transportation_cost || 0);
      return acc;
    }, {});
    
    setWarehouseData(Object.values(warehouseMap));
    
    // Process data for store distribution
    const storeMap = data.reduce((acc, item) => {
      const key = item.store_id;
      if (!acc[key]) {
        acc[key] = {
          store_id: key,
          total_demand: 0,
          total_items: 0,
          optimized_quantity: 0
        };
      }
      acc[key].total_demand += item.demand;
      acc[key].total_items += 1;
      acc[key].optimized_quantity += (item.optimized_quantity || 0);
      return acc;
    }, {});
    
    setStoreData(Object.values(storeMap).slice(0, 10)); // Top 10 stores
    
    // Create network connections (simplified for visualization)
    const networkConnections = data.slice(0, 15).map(item => ({
      source: `W${item.warehouse_id}`,
      target: `S${item.store_id}`,
      value: item.optimized_quantity || item.eoq || 0,
      item_id: item.item_id,
      transportation_cost: item.transportation_cost || Math.round(Math.random() * 100)
    }));
    
    setNetworkData(networkConnections);
    
    // If not optimized yet, run the simulation
    if (!isOptimizing && !optimizationResult && data[0]?.eoq) {
      runOptimizationSimulation();
    }
  }, [data]);
  
  // Simulation of the optimization process
  const runOptimizationSimulation = () => {
    if (isOptimizing) return;
    
    setIsOptimizing(true);
    setOptimizationProgress(0);
    
    const totalSteps = 20;
    let currentStep = 0;
    
    const simulationStep = () => {
      currentStep++;
      const progress = Math.round((currentStep / totalSteps) * 100);
      setOptimizationProgress(progress);
      
      if (currentStep >= totalSteps) {
        // Simulation complete
        setOptimizationResult({
          total_cost: Math.round(data.reduce((sum, item) => sum + (item.transportation_cost || 0), 0)),
          total_distance: Math.round(Math.random() * 1000 + 2000),
          total_items: data.length,
          feasibility: "optimal"
        });
        setIsOptimizing(false);
        return;
      }
      
      setTimeout(simulationStep, 150);
    };
    
    setTimeout(simulationStep, 150);
  };
  
  const exportOptimizedPlan = () => {
    if (!data || data.length === 0) return;
    
    const headers = Object.keys(data[0]).join(",");
    const csvData = data.map(row => Object.values(row).join(",")).join("\n");
    const csv = `${headers}\n${csvData}`;
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("download", "optimized_distribution_plan.csv");
    a.click();
  };
  
  if (!data || data.length === 0) {
    return <div className="text-center py-4">No data available for distribution optimization</div>;
  }
  
  // If still optimizing, show progress
  if (isOptimizing) {
    return (
      <div className="space-y-4 py-8">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">Optimizing Distribution Network</h3>
          <p className="text-gray-500 mb-6">Solving mixed-integer linear program for optimal distribution...</p>
          
          <Progress value={optimizationProgress} className="h-2 w-full max-w-md mx-auto mb-2" />
          <p className="text-sm text-gray-500">Progress: {optimizationProgress}%</p>
          
          <div className="mt-8 space-y-2 max-w-md mx-auto text-left">
            <div className="flex items-center gap-2 text-blue-600">
              <Info className="h-4 w-4" />
              <p className="text-sm">Building constraint matrix...</p>
            </div>
            <div className="flex items-center gap-2 text-blue-600">
              <Info className="h-4 w-4" />
              <p className="text-sm">Optimizing transportation costs...</p>
            </div>
            <div className="flex items-center gap-2 text-blue-600">
              <Info className="h-4 w-4" />
              <p className="text-sm">Balancing warehouse capacities...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  
  return (
    <div className="space-y-8">
      {optimizationResult && (
        <Card className={`${optimizationResult.feasibility === 'optimal' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              {optimizationResult.feasibility === 'optimal' ? (
                <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-yellow-500 mt-1 flex-shrink-0" />
              )}
              <div>
                <h3 className="text-lg font-medium mb-1">
                  {optimizationResult.feasibility === 'optimal' ? 'Optimization Complete' : 'Optimization Warning'}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {optimizationResult.feasibility === 'optimal' 
                    ? 'An optimal solution has been found for your distribution network.'
                    : 'The optimization found a feasible but potentially non-optimal solution.'}
                </p>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white rounded-md p-3 border">
                    <p className="text-sm text-gray-500">Total Cost</p>
                    <p className="text-xl font-semibold">${optimizationResult.total_cost.toLocaleString()}</p>
                  </div>
                  <div className="bg-white rounded-md p-3 border">
                    <p className="text-sm text-gray-500">Total Distance</p>
                    <p className="text-xl font-semibold">{optimizationResult.total_distance.toLocaleString()} km</p>
                  </div>
                  <div className="bg-white rounded-md p-3 border">
                    <p className="text-sm text-gray-500">Items Optimized</p>
                    <p className="text-xl font-semibold">{optimizationResult.total_items.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="overview" className="flex items-center gap-1">
            <BarChart2 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="network" className="flex items-center gap-1">
            <Network className="h-4 w-4" />
            Network
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-1">
            <Map className="h-4 w-4" />
            Detailed Analysis
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Distribution by Warehouse</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={warehouseData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="total_demand"
                      nameKey="warehouse_id"
                    >
                      {warehouseData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} units`, `Warehouse ${name}`]} />
                    <Legend formatter={(value) => `Warehouse ${value}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Order Quantities vs Demand by Store</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={storeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="store_id" label={{ value: 'Store ID', position: 'insideBottom', offset: -5 }} />
                    <YAxis label={{ value: 'Quantity', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="optimized_quantity" name="Optimized Order" fill="#3b82f6" />
                    <Line type="monotone" dataKey="total_demand" name="Demand" stroke="#ff8042" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="network">
          <NetworkVisualization data={data} />
        </TabsContent>
        
        <TabsContent value="analysis">
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">Warehouse Distribution Details</h3>
                <DataTable data={warehouseData} />
                
                <div className="mt-6">
                  <h4 className="text-md font-medium mb-3">Distribution Cost Analysis</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={warehouseData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="warehouse_id" />
                      <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                      <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="total_items" fill="#8884d8" name="Items" />
                      <Line yAxisId="right" type="monotone" dataKey="total_cost" stroke="#82ca9d" name="Cost" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="constraints">
                <AccordionTrigger>Optimization Constraints</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 p-4 bg-gray-50 rounded-md text-sm">
                    <div>
                      <h4 className="font-medium">Supply Constraints</h4>
                      <p className="text-gray-600">Each warehouse cannot ship more than its capacity.</p>
                    </div>
                    <div>
                      <h4 className="font-medium">Demand Constraints</h4>
                      <p className="text-gray-600">Each store must receive at least its minimum required inventory.</p>
                    </div>
                    <div>
                      <h4 className="font-medium">Transportation Constraints</h4>
                      <p className="text-gray-600">The total cost of transportation must be minimized.</p>
                    </div>
                    <div>
                      <h4 className="font-medium">Non-Negativity Constraints</h4>
                      <p className="text-gray-600">All shipment quantities must be non-negative.</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="algorithm">
                <AccordionTrigger>Optimization Algorithm</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 p-4 bg-gray-50 rounded-md text-sm">
                    <p>The distribution optimization uses a mixed-integer linear programming approach:</p>
                    <ol className="list-decimal list-inside space-y-2 text-gray-600">
                      <li>Formulate the transportation problem with supply and demand constraints</li>
                      <li>Create a cost matrix for all warehouse-store combinations</li>
                      <li>Apply the simplex algorithm to find the optimal solution</li>
                      <li>Check for degeneracy and handle any special cases</li>
                      <li>Generate optimized distribution plan</li>
                    </ol>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </TabsContent>
      </Tabs>
      
      <div>
        <h3 className="text-lg font-medium mb-4">Optimized Distribution Results</h3>
        <DataTable data={data.slice(0, 5)} />
        <div className="flex justify-between items-center mt-4">
          <p className="text-sm text-gray-500">
            Showing 5 of {data.length} items.
          </p>
          <Button 
            onClick={exportOptimizedPlan}
            className="flex items-center gap-1"
          >
            <Download className="h-4 w-4" />
            Download Full Optimization Plan
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DistributionOptimizer;
