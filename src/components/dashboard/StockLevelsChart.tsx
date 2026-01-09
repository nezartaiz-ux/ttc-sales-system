import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Package } from "lucide-react";

interface StockData {
  name: string;
  quantity: number;
  minStock: number;
  isLow: boolean;
}

export const StockLevelsChart = () => {
  const [stockData, setStockData] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStockData = async () => {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("name, quantity, min_stock_level")
        .eq("is_active", true)
        .order("quantity", { ascending: true })
        .limit(10);

      if (!error && data) {
        const formattedData = data.map((item) => ({
          name: item.name.length > 15 ? item.name.substring(0, 15) + "..." : item.name,
          quantity: item.quantity,
          minStock: item.min_stock_level || 0,
          isLow: item.quantity < (item.min_stock_level || 0),
        }));
        setStockData(formattedData);
      }
      setLoading(false);
    };

    fetchStockData();

    // Real-time subscription
    const channel = supabase
      .channel("inventory-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "inventory_items" },
        () => {
          fetchStockData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Stock Levels
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          Stock Levels
        </CardTitle>
        <CardDescription>Top 10 items with lowest stock</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stockData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis type="number" className="text-xs fill-muted-foreground" />
            <YAxis dataKey="name" type="category" width={100} className="text-xs fill-muted-foreground" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Bar dataKey="quantity" radius={[0, 4, 4, 0]}>
              {stockData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isLow ? "hsl(var(--destructive))" : "hsl(var(--primary))"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
