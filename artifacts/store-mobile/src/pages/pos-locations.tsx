import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

export default function POSLocations() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">نقاط البيع</h1>
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">صفحة نقاط البيع</h3>
          <p className="text-sm text-muted-foreground">إدارة مواقع الكاشير ونقاط البيع</p>
        </CardContent>
      </Card>
    </div>
  );
}
