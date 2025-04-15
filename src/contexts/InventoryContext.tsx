
import { createContext, useContext, useState, ReactNode } from "react";
import { useToast } from "@/components/ui/use-toast";
import { initialInventoryData } from "@/data/sampleData";

// Define types for our inventory data
export interface InventoryItem {
  item_id: string;
  store_id: string;
  warehouse_id: string;
  demand: number;
  order_cost: number;
  holding_cost: number;
  inventory_level: number;
}

export interface InventoryItemWithEOQ extends InventoryItem {
  eoq: number;
}

export interface OptimizedInventoryItem extends InventoryItemWithEOQ {
  optimized_quantity?: number;
  source_warehouse?: string;
  transportation_cost?: number;
}

interface InventoryContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  inventoryData: InventoryItem[];
  setInventoryData: (data: InventoryItem[]) => void;
  isCalculating: boolean;
  setIsCalculating: (isCalculating: boolean) => void;
  optimizedData: OptimizedInventoryItem[] | null;
  setOptimizedData: (data: OptimizedInventoryItem[] | null) => void;
  handleDataUpload: (data: InventoryItem[]) => void;
  handleEOQCalculation: () => Promise<void>;
  handleDistributionOptimization: () => Promise<void>;
  downloadCsv: () => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider = ({ children }: { children: ReactNode }) => {
  const [activeTab, setActiveTab] = useState("upload");
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>(initialInventoryData);
  const [isCalculating, setIsCalculating] = useState(false);
  const [optimizedData, setOptimizedData] = useState<OptimizedInventoryItem[] | null>(null);
  const { toast } = useToast();

  const handleDataUpload = (data: InventoryItem[]) => {
    setInventoryData(data);
    toast({
      title: "Data Uploaded Successfully",
      description: `${data.length} records have been loaded.`,
    });
    setActiveTab("preview");
  };

  const handleEOQCalculation = async () => {
    setIsCalculating(true);
    // Simulate calculation delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    // Calculate EOQ for each item
    const calculatedData: InventoryItemWithEOQ[] = inventoryData.map(item => {
      const { demand, order_cost, holding_cost } = item;
      const eoq = Math.sqrt((2 * demand * order_cost) / holding_cost);
      return {
        ...item,
        eoq: Math.round(eoq)
      };
    });
    
    setInventoryData(calculatedData as any);
    setOptimizedData(calculatedData as OptimizedInventoryItem[]);
    setIsCalculating(false);
    setActiveTab("eoq");
    
    toast({
      title: "EOQ Calculation Complete",
      description: "Economic Order Quantity has been calculated for all items.",
    });
  };

  const handleDistributionOptimization = async () => {
    setIsCalculating(true);
    // Simulate optimization delay
    await new Promise((resolve) => setTimeout(resolve, 2500));
    
    // This would be replaced with actual optimization algorithm
    const optimizedResults: OptimizedInventoryItem[] = (inventoryData as InventoryItemWithEOQ[]).map(item => ({
      ...item,
      optimized_quantity: Math.round(item.eoq * 0.9 + Math.random() * item.eoq * 0.2),
      source_warehouse: item.warehouse_id,
      transportation_cost: Math.round(5 + Math.random() * 20)
    }));
    
    setOptimizedData(optimizedResults);
    setIsCalculating(false);
    setActiveTab("distribution");
    
    toast({
      title: "Distribution Optimization Complete",
      description: "The optimal distribution plan has been calculated.",
    });
  };

  const downloadCsv = () => {
    if (!optimizedData) return;
    
    const headers = Object.keys(optimizedData[0]).join(",");
    const csvData = optimizedData.map(row => Object.values(row).join(",")).join("\n");
    const csv = `${headers}\n${csvData}`;
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("download", "optimized_supply_chain.csv");
    a.click();
  };

  const value = {
    activeTab,
    setActiveTab,
    inventoryData,
    setInventoryData,
    isCalculating,
    setIsCalculating,
    optimizedData,
    setOptimizedData,
    handleDataUpload,
    handleEOQCalculation,
    handleDistributionOptimization,
    downloadCsv
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error("useInventory must be used within an InventoryProvider");
  }
  return context;
};
