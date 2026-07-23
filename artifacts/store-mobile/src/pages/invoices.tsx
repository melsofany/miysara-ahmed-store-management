import React from 'react';
import { useInvoices } from '@/hooks/use-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Link } from 'wouter';

export default function Invoices() {
  const { data: invoices, isLoading } = useInvoices();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-20" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">الفواتير</h1>
      
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="البحث في الفواتير..." className="pr-10" />
      </div>

      {invoices && invoices.length > 0 ? (
        <div className="space-y-3">
          {invoices.map((invoice) => (
            <Link key={invoice.id} href={`/invoices/${invoice.id}`}>
              <Card className="cursor-pointer hover:border-primary transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{invoice.invoice_number}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(invoice.created_at).toLocaleDateString('ar-EG')}
                        </p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-primary">{invoice.total.toLocaleString('ar-EG')} ج.م</p>
                      <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'} className="mt-1">
                        {invoice.status === 'paid' ? 'مدفوع' : invoice.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">لا يوجد فواتير</h3>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
