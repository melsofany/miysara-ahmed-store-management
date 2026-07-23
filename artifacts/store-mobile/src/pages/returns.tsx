import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Undo2 } from 'lucide-react';

export default function Returns() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">المرتجعات</h1>
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Undo2 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">صفحة المرتجعات</h3>
          <p className="text-sm text-muted-foreground">إدارة مرتجعات المبيعات</p>
        </CardContent>
      </Card>
    </div>
  );
}
