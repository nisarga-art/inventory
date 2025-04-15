
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/PageHeader";
import UploadTab from "@/components/UploadTab";
import PreviewTab from "@/components/PreviewTab";
import EOQTab from "@/components/EOQTab";
import DistributionTab from "@/components/DistributionTab";
import { InventoryProvider, useInventory } from "@/contexts/InventoryContext";

const IndexContent = () => {
  const { activeTab, setActiveTab } = useInventory();

  return (
    <div className="container mx-auto py-8 px-4">
      <PageHeader />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger value="upload">Data Upload</TabsTrigger>
          <TabsTrigger value="preview">Data Preview</TabsTrigger>
          <TabsTrigger value="eoq">EOQ Analysis</TabsTrigger>
          <TabsTrigger value="distribution">Distribution Plan</TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <UploadTab />
        </TabsContent>

        <TabsContent value="preview">
          <PreviewTab />
        </TabsContent>

        <TabsContent value="eoq">
          <EOQTab />
        </TabsContent>

        <TabsContent value="distribution">
          <DistributionTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const Index = () => {
  return (
    <InventoryProvider>
      <IndexContent />
    </InventoryProvider>
  );
};

export default Index;
