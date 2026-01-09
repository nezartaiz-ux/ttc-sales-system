import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Layers } from "lucide-react";

interface CategoryData {
  name: string;
  items: number;
  value: number;
}

const CATEGORY_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(210, 70%, 50%)",
  "hsl(142, 71%, 45%)",
  "hsl(280, 60%, 50%)",
  "hsl(25, 80%, 50%)",
];

export const CategoryStockChart = () => {
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategoryData = async () => {
      const { data: categories, error: catError } = await supabase
        .from("product_categories")
        .select("id, name")
        .eq("is_active", true);

      if (catError || !categories) {
        setLoading(false);
        return;
      }

      const categoryStats: CategoryData[] = [];

      for (const category of categories) {
        const { data: items, error: itemsError } = await supabase
          .from("inventory_items")
          .select("quantity, selling_price")
          .eq("category_id", category.id)
          .eq("is_active", true);

        if (!itemsError && items) {
          const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
          const totalValue = items.reduce((sum, item) => sum + item.quantity * item.selling_price, 0);
          
          categoryStats.push({
            name: category.name.length > 12 ? category.name.substring(0, 12) + "..." : category.name,
            items: totalItems,
            value: totalValue,
          });
        }
      }

      setCategoryData(categoryStats.sort((a, b) => b.value - a.value).slice(0, 6));
      setLoading(false);
    };

    fetchCategoryData();

    // Real-time subscription
    const channel = supabase
      .channel("category-stock-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "inventory_items" },
        () => {
          fetchCategoryData();
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
            <Layers className="h-5 w-5 text-accent" />
            Stock by Category
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-accent" />
          Stock by Category
        </CardTitle>
        <CardDescription>Inventory value per category</CardDescription>
      </CardHeader>
      <CardContent>
        {categoryData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No category data found
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs fill-muted-foreground" />
              <YAxis className="text-xs fill-muted-foreground" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value: number, name: string) => [
                  name === "value" ? `$${value.toLocaleString()}` : value,
                  name === "value" ? "Value" : "Items",
                ]}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {categoryData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
