import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';

type KpiCardProps = {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
};

export function KpiCard({ title, value, icon: Icon, description }: KpiCardProps) {
  return (
    <Card className="kpi-card">
      <CardHeader className="kpi-card-header">
        <CardTitle className="kpi-card-title">{title}</CardTitle>
        <div className="kpi-card-icon-wrap">
          <Icon className="kpi-card-icon" />
        </div>
      </CardHeader>

      <CardContent className="kpi-card-content">
        <div className="kpi-card-value">{value}</div>
        {description ? <p className="kpi-card-description">{description}</p> : null}
      </CardContent>
    </Card>
  );
}
