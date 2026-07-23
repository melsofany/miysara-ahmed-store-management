import React from 'react';
import { useDashboardStats } from '@/hooks/use-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, ShoppingBag, Package, AlertTriangle, TrendingUp, Calendar, FileText } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Dashboard() {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-20" />
              <CardContent className="h-10" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-foreground">لوحة التحكم</h1>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select defaultValue="today">
            <SelectTrigger className="w-[140px]">
              <Calendar className="w-4 h-4 me-2 opacity-50" />
              <SelectValue placeholder="الفترة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">اليوم</SelectItem>
              <SelectItem value="yesterday">أمس</SelectItem>
              <SelectItem value="week">هذا الأسبوع</SelectItem>
              <SelectItem value="month">هذا الشهر</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <TrendingUp className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">المبيعات</CardTitle>
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats?.total_sales?.toLocaleString('ar-EG')} ج.م</div>
            <p className="text-xs text-muted-foreground mt-1">
              +20.1% مقارنة بالفترة السابقة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الطلبات</CardTitle>
            <div className="h-8 w-8 rounded-full bg-secondary/20 flex items-center justify-center">
              <ShoppingBag className="h-4 w-4 text-secondary-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_orders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              +12 طلب جديد
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المنتجات النشطة</CardTitle>
            <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center">
              <Package className="h-4 w-4 text-accent-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.active_products}</div>
            <p className="text-xs text-muted-foreground mt-1">
              في 5 مخازن
            </p>
          </CardContent>
        </Card>

        <Card className="border-destructive/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-destructive">نواقص المخزون</CardTitle>
            <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats?.low_stock}</div>
            <p className="text-xs text-muted-foreground mt-1">
              منتجات تحتاج لإعادة طلب
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-1 lg:col-span-4">
          <CardHeader>
            <CardTitle>المبيعات خلال الأسبوع</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-md border border-dashed border-border mx-6 mb-6">
            مساحة الرسم البياني للمبيعات (Recharts)
          </CardContent>
        </Card>
        
        <Card className="col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle>أحدث الفواتير</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 border-b pb-4 last:border-0 last:pb-0">
                  <div className="h-10 w-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">INV-{2024000 + i}</p>
                    <p className="text-xs text-muted-foreground">منذ {i * 10} دقيقة</p>
                  </div>
                  <div className="text-sm font-bold">
                    {(i * 150.5).toLocaleString('ar-EG')} ج.م
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
