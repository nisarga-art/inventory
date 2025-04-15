import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ZoomIn, ZoomOut, RefreshCw, Save, ArrowUpRight, Warehouse, Store, Package
} from "lucide-react";

interface Node {
  id: string;
  type: "warehouse" | "store";
  x: number;
  y: number;
}

interface Link {
  source: string;
  target: string;
  value: number;
  color?: string;
}

interface NetworkVisualizationProps {
  data: any[];
}

const NetworkVisualization = ({ data }: NetworkVisualizationProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [zoom, setZoom] = useState(1);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [linkThickness, setLinkThickness] = useState(75);
  
  // Extract unique warehouses and stores from data
  useEffect(() => {
    if (!data || data.length === 0) return;
    
    const warehousesSet = new Set<string>();
    const storesSet = new Set<string>();
    const linksMap = new Map<string, number>();
    
    // Collect unique warehouses, stores, and links
    data.forEach(item => {
      const warehouseId = item.warehouse_id;
      const storeId = item.store_id;
      warehousesSet.add(warehouseId);
      storesSet.add(storeId);
      
      // Aggregate link values
      const linkKey = `${warehouseId}-${storeId}`;
      const currentValue = linksMap.get(linkKey) || 0;
      linksMap.set(linkKey, currentValue + (item.optimized_quantity || item.eoq || 0));
    });
    
    // Create nodes with positions
    const newNodes: Node[] = [];
    
    // Warehouse nodes at the top
    const warehouses = Array.from(warehousesSet);
    const warehouseStep = 800 / (warehouses.length + 1);
    warehouses.forEach((id, index) => {
      newNodes.push({
        id: `w-${id}`,
        type: "warehouse",
        x: (index + 1) * warehouseStep,
        y: 100
      });
    });
    
    // Store nodes at the bottom
    const stores = Array.from(storesSet);
    const storeStep = 800 / (stores.length + 1);
    stores.forEach((id, index) => {
      newNodes.push({
        id: `s-${id}`,
        type: "store",
        x: (index + 1) * storeStep,
        y: 400
      });
    });
    
    // Create links
    const newLinks: Link[] = [];
    for (const [key, value] of linksMap.entries()) {
      const [warehouseId, storeId] = key.split('-');
      newLinks.push({
        source: `w-${warehouseId}`,
        target: `s-${storeId}`,
        value: value,
        color: getRandomColor()
      });
    }
    
    setNodes(newNodes);
    setLinks(newLinks);
  }, [data]);
  
  // Draw the network on canvas
  useEffect(() => {
    if (!canvasRef.current || nodes.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply zoom
    ctx.save();
    ctx.scale(zoom, zoom);
    ctx.translate((canvas.width / zoom - canvas.width) / 2, (canvas.height / zoom - canvas.height) / 2);
    
    // Draw links
    links.forEach(link => {
      const source = nodes.find(node => node.id === link.source);
      const target = nodes.find(node => node.id === link.target);
      if (!source || !target) return;
      
      // Thickness based on value and slider
      const thickness = Math.max(1, Math.min(10, link.value / linkThickness));
      
      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);
      ctx.strokeStyle = selectedNode ? 
        (link.source === selectedNode || link.target === selectedNode ? link.color || '#3b82f6' : '#e5e7eb') : 
        (link.color || '#3b82f6');
      ctx.lineWidth = thickness;
      ctx.stroke();
      
      // Draw arrow in the middle of the link
      const midX = (source.x + target.x) / 2;
      const midY = (source.y + target.y) / 2;
      const angle = Math.atan2(target.y - source.y, target.x - source.x);
      
      ctx.save();
      ctx.translate(midX, midY);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-10, -5);
      ctx.lineTo(-10, 5);
      ctx.closePath();
      ctx.fillStyle = selectedNode ? 
        (link.source === selectedNode || link.target === selectedNode ? link.color || '#3b82f6' : '#e5e7eb') : 
        (link.color || '#3b82f6');
      ctx.fill();
      ctx.restore();
      
      // Draw value label
      ctx.save();
      ctx.translate(midX, midY);
      ctx.rotate(angle);
      ctx.translate(0, -10);
      ctx.rotate(-angle);
      ctx.font = '10px Arial';
      ctx.fillStyle = '#6b7280';
      ctx.textAlign = 'center';
      ctx.fillText(link.value.toString(), 0, 0);
      ctx.restore();
    });
    
    // Draw nodes
    nodes.forEach(node => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, 15, 0, Math.PI * 2);
      ctx.fillStyle = selectedNode === node.id ? '#ef4444' : (node.type === 'warehouse' ? '#3b82f6' : '#10b981');
      ctx.fill();
      
      // Node label
      ctx.font = 'bold 10px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.id.replace(/^[ws]-/, ''), node.x, node.y);
      
      // Node type icon
      ctx.font = '8px Arial';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.type === 'warehouse' ? 'WH' : 'ST', node.x, node.y + 12);
    });
    
    ctx.restore();
  }, [nodes, links, zoom, selectedNode, linkThickness]);
  
  // Handle canvas click to select nodes
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    
    // Check if a node was clicked
    for (const node of nodes) {
      const dx = node.x - x;
      const dy = node.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= 15) {
        setSelectedNode(node.id === selectedNode ? null : node.id);
        return;
      }
    }
    
    // If no node was clicked, deselect
    setSelectedNode(null);
  };
  
  // Force-directed layout simulation
  const runSimulation = () => {
    setIsSimulating(true);
    
    // Simple force-directed layout algorithm
    const iterations = 50;
    let currentIteration = 0;
    
    const simulationStep = () => {
      if (currentIteration >= iterations) {
        setIsSimulating(false);
        return;
      }
      
      // Copy nodes to avoid direct state mutation
      const newNodes = [...nodes];
      
      // Apply forces
      for (let i = 0; i < newNodes.length; i++) {
        const node1 = newNodes[i];
        
        // Repulsive force from other nodes
        for (let j = 0; j < newNodes.length; j++) {
          if (i === j) continue;
          
          const node2 = newNodes[j];
          const dx = node1.x - node2.x;
          const dy = node1.y - node2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 0 && distance < 200) {
            const repulsiveForce = 100 / distance;
            const fx = dx / distance * repulsiveForce;
            const fy = dy / distance * repulsiveForce;
            
            node1.x += fx;
            node1.y += fy;
          }
        }
        
        // Keep warehouses at top and stores at bottom approximately
        if (node1.type === 'warehouse') {
          node1.y += (100 - node1.y) * 0.1;
        } else {
          node1.y += (400 - node1.y) * 0.1;
        }
        
        // Keep within canvas bounds
        node1.x = Math.max(50, Math.min(750, node1.x));
        node1.y = Math.max(50, Math.min(450, node1.y));
      }
      
      // Apply spring forces along links
      for (const link of links) {
        const source = newNodes.find(node => node.id === link.source);
        const target = newNodes.find(node => node.id === link.target);
        
        if (source && target) {
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 0) {
            const springForce = (distance - 150) * 0.01;
            const fx = dx / distance * springForce;
            const fy = dy / distance * springForce;
            
            source.x += fx;
            source.y += fy;
            target.x -= fx;
            target.y -= fy;
          }
        }
      }
      
      // Update state
      setNodes(newNodes);
      
      // Continue simulation
      currentIteration++;
      requestAnimationFrame(simulationStep);
    };
    
    simulationStep();
  };
  
  // Helper to generate random colors for links
  function getRandomColor() {
    const colors = [
      '#3b82f6', '#10b981', '#ef4444', '#f59e0b', 
      '#8b5cf6', '#ec4899', '#6b7280', '#0ea5e9'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  // Export canvas as image
  const exportNetworkImage = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = image;
    link.download = 'distribution_network.png';
    link.click();
  };
  
  if (!data || data.length === 0) {
    return <div className="text-center py-4">No data available for network visualization</div>;
  }
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Distribution Network Visualization</h3>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
              disabled={zoom <= 0.5}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">{Math.round(zoom * 100)}%</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setZoom(Math.min(2, zoom + 0.1))}
              disabled={zoom >= 2}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={runSimulation}
              disabled={isSimulating}
            >
              <RefreshCw className={`h-4 w-4 ${isSimulating ? 'animate-spin' : ''}`} />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={exportNetworkImage}
            >
              <Save className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex gap-4 mb-4">
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-full bg-blue-500"></div>
            <span className="text-xs">Warehouse</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-full bg-green-500"></div>
            <span className="text-xs">Store</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs">Link Thickness:</span>
            <Slider 
              value={[linkThickness]} 
              min={10} 
              max={200} 
              step={10}
              onValueChange={(value) => setLinkThickness(value[0])}
              className="w-32"
            />
          </div>
        </div>
        
        <div className="relative border rounded-md overflow-hidden bg-gray-50">
          <canvas 
            ref={canvasRef} 
            width={800} 
            height={500}
            onClick={handleCanvasClick}
            className="w-full h-[500px] cursor-pointer"
          />
          
          {selectedNode && (
            <div className="absolute top-2 right-2 bg-white p-3 rounded-md shadow-md border text-sm">
              <h4 className="font-medium flex items-center gap-1">
                {selectedNode.startsWith('w-') ? (
                  <>
                    <Warehouse className="h-4 w-4 text-blue-500" />
                    Warehouse {selectedNode.replace('w-', '')}
                  </>
                ) : (
                  <>
                    <Store className="h-4 w-4 text-green-500" />
                    Store {selectedNode.replace('s-', '')}
                  </>
                )}
              </h4>
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Connections:</span>
                  <Badge variant="secondary">
                    {links.filter(l => l.source === selectedNode || l.target === selectedNode).length}
                  </Badge>
                </div>
                {selectedNode.startsWith('w-') ? (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Outgoing Items:</span>
                    <Badge className="bg-blue-500">
                      {links.filter(l => l.source === selectedNode)
                        .reduce((sum, link) => sum + link.value, 0)}
                    </Badge>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Incoming Items:</span>
                    <Badge className="bg-green-500">
                      {links.filter(l => l.target === selectedNode)
                        .reduce((sum, link) => sum + link.value, 0)}
                    </Badge>
                  </div>
                )}
                <div className="pt-2">
                  <Button variant="link" size="sm" className="h-6 p-0 flex items-center gap-1">
                    View Details
                    <ArrowUpRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-4 text-sm text-gray-500">
          <p>Click on nodes to see connection details. Use zoom controls to adjust view.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default NetworkVisualization;
