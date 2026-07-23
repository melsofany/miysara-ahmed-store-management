import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export default function Reports() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">التقارير التحليلية</h1>
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">صفحة التقارير</h3>
          <p className="text-sm text-muted-foreground">تقارير المبيعات والمخزون والإيرادات</p>
        </CardContent>
      </Card>
    </div>
  );
}
