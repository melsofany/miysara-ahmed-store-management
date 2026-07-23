import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Shield } from 'lucide-react';

export default function Roles() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">الأدوار والصلاحيات</h1>
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Shield className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">صفحة الأدوار</h3>
          <p className="text-sm text-muted-foreground">إدارة الأدوار والصلاحيات</p>
        </CardContent>
      </Card>
    </div>
  );
}
