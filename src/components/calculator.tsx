"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfitFromPriceForm from "@/components/profit-from-price-form";
import PriceFromProfitForm from "@/components/price-from-profit-form";

export default function CalculatorComponent() {
  return (
    <Tabs defaultValue="profit-from-price" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="profit-from-price">Profit from Price</TabsTrigger>
        <TabsTrigger value="price-from-profit">Price from Profit</TabsTrigger>
      </TabsList>
      <TabsContent value="profit-from-price">
        <ProfitFromPriceForm />
      </TabsContent>
      <TabsContent value="price-from-profit">
        <PriceFromProfitForm />
      </TabsContent>
    </Tabs>
  );
}
