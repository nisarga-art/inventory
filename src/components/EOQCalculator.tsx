
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import DataTable from "./DataTable";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Scatter, ScatterChart, ZAxis
} from "recharts";
import { Calculator, TrendingUp, BarChart2, Download } from "lucide-react";

interface EOQItem {
  item_id: string;
  store_id: string;
  warehouse_id: string;
  demand: number;
  order_cost: number;
  holding_cost: number;
  inventory_level: number;
  eoq?: number;
}

interface ChartItem {
  item_id: string;
  total_demand: number;
  avg_eoq: number;
}

interface CostItem {
  q: number;
  cost: number;
  type: string;
}

interface EOQCalculatorProps {
  data: EOQItem[];
}

const EOQCalculator = ({ data }: EOQCalculatorProps) => {
  const [chartData, setChartData] = useState<ChartItem[]>([]);
  const [costData, setCostData] = useState<CostItem[]>([]);
  const [sensitivityData, setSensitivityData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [demandFactor, setDemandFactor] = useState(100);
  const [costFactor, setCostFactor] = useState(100);
  
  useEffect(() => {
    if (!data || data.length === 0) return;
    
    // Prepare data for EOQ by item chart
    const itemGroups = data.reduce<Record<string, EOQItem[]>>((acc, item) => {
      const key = item.item_id;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {});
    
    const chartItems = Object.keys(itemGroups).map(itemId => {
      const items = itemGroups[itemId];
      const totalDemand = items.reduce((sum, item) => sum + item.demand, 0);
      const avgEOQ = items.reduce((sum, item) => sum + (item.eoq || 0), 0) / items.length;
      
      return {
        item_id: itemId,
        total_demand: totalDemand,
        avg_eoq: Math.round(avgEOQ)
      };
    }).slice(0, 10); // Take top 10 for chart
    
    setChartData(chartItems);
    
    // Prepare cost comparison data
    if (data[0]?.eoq) {
      const costItem = data[0]; // Sample item for cost analysis
      const orderCosts: CostItem[] = [];
      const holdingCosts: CostItem[] = [];
      const totalCosts: CostItem[] = [];
      
      for (let q = Math.max(1, costItem.eoq * 0.5); q <= costItem.eoq * 1.5; q += Math.max(1, costItem.eoq * 0.1)) {
        const orderCost = (costItem.demand / q) * costItem.order_cost;
        const holdingCost = (q / 2) * costItem.holding_cost;
        const totalCost = orderCost + holdingCost;
        
        orderCosts.push({ q, cost: orderCost, type: 'Order Cost' });
        holdingCosts.push({ q, cost: holdingCost, type: 'Holding Cost' });
        totalCosts.push({ q, cost: totalCost, type: 'Total Cost' });
      }
      
      setCostData([...orderCosts, ...holdingCosts, ...totalCosts]);
      
      // Generate sensitivity analysis data
      const sensitivityPoints = [];
      for (let demandPct = 50; demandPct <= 150; demandPct += 10) {
        for (let costPct = 50; costPct <= 150; costPct += 10) {
          const adjustedDemand = costItem.demand * (demandPct / 100);
          const adjustedOrderCost = costItem.order_cost * (costPct / 100);
          const newEoq = Math.sqrt((2 * adjustedDemand * adjustedOrderCost) / costItem.holding_cost);
          
          sensitivityPoints.push({
            demand_factor: demandPct,
            cost_factor: costPct,
            eoq: Math.round(newEoq),
            z: Math.round(newEoq)
          });
        }
      }
      setSensitivityData(sensitivityPoints);
    }
  }, [data]);
  
  // Calculate adjusted EOQ based on sliders
  const calculateAdjustedEOQ = () => {
    if (!data || data.length === 0 || !data[0]?.eoq) return [];
    
    return data.map(item => {
      const adjustedDemand = item.demand * (demandFactor / 100);
      const adjustedOrderCost = item.order_cost * (costFactor / 100);
      const newEoq = Math.sqrt((2 * adjustedDemand * adjustedOrderCost) / item.holding_cost);
      
      return {
        ...item,
        demand: adjustedDemand,
        order_cost: adjustedOrderCost,
        eoq: Math.round(newEoq),
        original_eoq: item.eoq
      };
    });
  };
  
  const adjustedData = calculateAdjustedEOQ();
  
  // Export adjusted EOQ data as CSV
  const exportAdjustedEOQ = () => {
    if (!adjustedData.length) return;
    
    const headers = Object.keys(adjustedData[0]).join(",");
    const csvData = adjustedData.map(row => Object.values(row).join(",")).join("\n");
    const csv = `${headers}\n${csvData}`;
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("download", "adjusted_eoq_results.csv");
    a.click();
  };
  
  if (!data || data.length === 0) {
    return <div className="text-center py-4">No data available for EOQ calculation</div>;
  }
  
  if (!data[0]?.eoq) {
    return (
      <div className="text-center py-6">
        <p className="mb-4">Calculating EOQ for {data.length} items...</p>
        <Progress value={45} className="w-full h-2" />
      </div>
    );
  }
  
  // Colors for charts
  const COLORS = ['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899'];
  
  return (
    <div className="space-y-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="overview" className="flex items-center gap-1">
            <BarChart2 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="cost" className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            Cost Analysis
          </TabsTrigger>
          <TabsTrigger value="sensitivity" className="flex items-center gap-1">
            <Calculator className="h-4 w-4" />
            Sensitivity Analysis
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">EOQ by Item</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="item_id" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="avg_eoq" fill="#3b82f6" name="EOQ" />
                    <Bar dataKey="total_demand" fill="#93c5fd" name="Demand" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4">EOQ Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="avg_eoq"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} units`, `Item`]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="cost">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">Cost Analysis for Item {data[0]?.item_id}</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={costData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="q" 
                    label={{ value: 'Order Quantity', position: 'insideBottomRight', offset: -5 }} 
                  />
                  <YAxis 
                    label={{ value: 'Cost', angle: -90, position: 'insideLeft' }} 
                  />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="cost" 
                    name="Cost"
                    stroke="#3b82f6" 
                    dot={false}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
              
              <div className="mt-6 grid gap-4">
                <h4 className="text-md font-medium">Cost Breakdown</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={costData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="q" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {costData
                      .filter(item => item.type)
                      .filter((item, index, self) => 
                        index === self.findIndex(t => t.type === item.type)
                      )
                      .map((entry, index) => (
                        <Line 
                          key={entry.type}
                          type="monotone" 
                          dataKey="cost" 
                          data={costData.filter(item => item.type === entry.type)}
                          name={entry.type} 
                          stroke={COLORS[index % COLORS.length]}
                          dot={false}
                        />
                      ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sensitivity">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">Sensitivity Analysis</h3>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-md font-medium mb-2">Demand Factor: {demandFactor}%</h4>
                  <Slider 
                    value={[demandFactor]} 
                    min={50} 
                    max={150} 
                    step={5}
                    onValueChange={(value) => setDemandFactor(value[0])}
                    className="mb-6"
                  />
                  
                  <h4 className="text-md font-medium mb-2">Order Cost Factor: {costFactor}%</h4>
                  <Slider 
                    value={[costFactor]} 
                    min={50} 
                    max={150} 
                    step={5}
                    onValueChange={(value) => setCostFactor(value[0])}
                  />
                </div>
                
                <ResponsiveContainer width="100%" height={200}>
                  <ScatterChart>
                    <CartesianGrid />
                    <XAxis 
                      type="number" 
                      dataKey="demand_factor" 
                      name="Demand Factor" 
                      unit="%" 
                    />
                    <YAxis 
                      type="number" 
                      dataKey="cost_factor" 
                      name="Order Cost Factor" 
                      unit="%"
                    />
                    <ZAxis 
                      type="number" 
                      dataKey="z" 
                      range={[50, 400]} 
                    />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter 
                      name="EOQ Sensitivity" 
                      data={sensitivityData} 
                      fill="#3b82f6"
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              
              <h4 className="text-md font-medium mb-4">Adjusted EOQ Results</h4>
              <DataTable data={adjustedData.slice(0, 5)} />
              
              <div className="flex justify-end mt-4">
                <Button 
                  onClick={exportAdjustedEOQ}
                  className="flex items-center gap-1"
                >
                  <Download className="h-4 w-4" />
                  Download Adjusted EOQ Results
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div>
        <h3 className="text-lg font-medium mb-4">EOQ Results</h3>
        <DataTable data={data.slice(0, 5)} />
        <p className="text-sm text-gray-500 mt-2">
          Showing 5 of {data.length} items. Download the full results for all items.
        </p>
      </div>
    </div>
  );
};

export default EOQCalculator;
