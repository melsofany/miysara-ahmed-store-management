import React from 'react';
import { useParams } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Printer } from 'lucide-react';

export default function InvoiceDetail() {
  const params = useParams<{ id: string }>();

  // Mock invoice data
  const invoice = {
    invoice_number: 'INV-2024001',
    created_at: new Date().toISOString(),
    total: 1250.50,
    payment_method: 'cash',
    status: 'paid',
    items: [
      { name: 'قميص قطني', qty: 2, unit_price: 250, total: 500 },
      { name: 'بنطلون جينز', qty: 1, unit_price: 450, total: 450 },
      { name: 'حذاء رياضي', qty: 1, unit_price: 300.5, total: 300.5 },
    ]
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">تفاصيل الفاتورة</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Printer className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="bg-primary/5 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded bg-primary/20 flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">{invoice.invoice_number}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {new Date(invoice.created_at).toLocaleDateString('ar-EG', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
            <Badge variant="default" className="text-sm">مدفوع</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-3">
            <h3 className="font-medium">تفاصيل البنود:</h3>
            {invoice.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start py-2 border-b last:border-0">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.qty} × {item.unit_price.toLocaleString('ar-EG')} ج.م
                  </p>
                </div>
                <p className="font-bold">{item.total.toLocaleString('ar-EG')} ج.م</p>
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-4 border-t">
            <div className="flex justify-between text-lg">
              <span className="font-medium">المجموع:</span>
              <span className="font-bold text-primary">{invoice.total.toLocaleString('ar-EG')} ج.م</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>طريقة الدفع:</span>
              <span>{invoice.payment_method === 'cash' ? 'نقدي' : 'بطاقة'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
