import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { cn } from "~/lib/utils";

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "primary" | "success" | "caution" | "destructive" | "default";
  subtitle?: string;
}

const toneMap = {
  primary: "text-celis-primary",
  success: "text-celis-success",
  caution: "text-celis-caution",
  destructive: "text-celis-destructive",
  default: "text-celis-ink-secondary",
};

export function KpiCard({
  title,
  value,
  icon: Icon,
  tone = "default",
  subtitle,
}: KpiCardProps) {
  return (
    <Card className="border-celis-border bg-celis-surface-base">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-celis-ink-secondary">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <Icon className={cn("h-5 w-5", toneMap[tone])} />
          <span className="text-3xl font-bold tabular-nums text-celis-ink">
            {value}
          </span>
        </div>
        {subtitle && (
          <p className="mt-1 text-xs text-celis-ink-secondary">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
