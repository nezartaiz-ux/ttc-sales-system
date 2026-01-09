import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { FileText } from "lucide-react";

interface QuotationStats {
  name: string;
  value: number;
  color: string;
}

const COLORS = {
  draft: "hsl(var(--muted-foreground))",
  sent: "hsl(var(--primary))",
  accepted: "hsl(142, 71%, 45%)",
  rejected: "hsl(var(--destructive))",
  expired: "hsl(280, 60%, 50%)",
};

export const QuotationStatsChart = () => {
  const [quotationData, setQuotationData] = useState<QuotationStats[]>([]);
  const [totalQuotations, setTotalQuotations] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuotationStats = async () => {
      const { data, error } = await supabase
        .from("quotations")
        .select("status");

      if (!error && data) {
        const statusCounts: Record<string, number> = {
          draft: 0,
          sent: 0,
          accepted: 0,
          rejected: 0,
          expired: 0,
        };

        data.forEach((q) => {
          const status = q.status?.toLowerCase() || "draft";
          if (statusCounts[status] !== undefined) {
            statusCounts[status]++;
          } else {
            statusCounts["draft"]++;
          }
        });

        const formattedData: QuotationStats[] = [
          { name: "Draft", value: statusCounts.draft, color: COLORS.draft },
          { name: "Sent", value: statusCounts.sent, color: COLORS.sent },
          { name: "Accepted", value: statusCounts.accepted, color: COLORS.accepted },
          { name: "Rejected", value: statusCounts.rejected, color: COLORS.rejected },
          { name: "Expired", value: statusCounts.expired, color: COLORS.expired },
        ].filter((item) => item.value > 0);

        setQuotationData(formattedData);
        setTotalQuotations(data.length);
      }
      setLoading(false);
    };

    fetchQuotationStats();

    // Real-time subscription
    const channel = supabase
      .channel("quotation-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quotations" },
        () => {
          fetchQuotationStats();
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
            <FileText className="h-5 w-5 text-primary" />
            Quotation Statistics
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
          <FileText className="h-5 w-5 text-primary" />
          Quotation Statistics
        </CardTitle>
        <CardDescription>Status distribution ({totalQuotations} total)</CardDescription>
      </CardHeader>
      <CardContent>
        {quotationData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No quotations found
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={quotationData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {quotationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
