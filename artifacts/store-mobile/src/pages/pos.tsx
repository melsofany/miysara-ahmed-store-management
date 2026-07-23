import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Minus, ShoppingCart, Barcode, CreditCard, Banknote, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface CartItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  qty: number;
}

export default function POS() {
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [showCheckout, setShowCheckout] = useState(false);
  const { toast } = useToast();

  // Mock products for POS
  const mockProducts = [
    { id: '1', name: 'قميص قطني', sku: 'SH-001', price: 250, stock: 15 },
    { id: '2', name: 'بنطلون جينز', sku: 'PN-001', price: 450, stock: 8 },
    { id: '3', name: 'حذاء رياضي', sku: 'SH-002', price: 850, stock: 12 },
    { id: '4', name: 'حقيبة جلدية', sku: 'BG-001', price: 650, stock: 5 },
  ];

  const filteredProducts = mockProducts.filter((p) => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product: typeof mockProducts[0]) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.id === product.id ? { ...item, qty: item.qty + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
    toast({ title: 'تمت الإضافة للسلة', description: product.name });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : item;
      }
      return item;
    }).filter(item => item.qty > 0));
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({ 
        variant: 'destructive',
        title: 'السلة فارغة',
        description: 'أضف منتجات للسلة أولاً'
      });
      return;
    }
    setShowCheckout(true);
  };

  const completeSale = async () => {
    // Here you would call the API to create invoice
    toast({ 
      title: 'تمت العملية بنجاح',
      description: `تم إصدار فاتورة بمبلغ ${total.toLocaleString('ar-EG')} ج.م`
    });
    setCart([]);
    setShowCheckout(false);
    setSearch('');
  };

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background">
      {/* Main POS Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="border-b border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-primary">نقطة البيع</h1>
            <Badge variant="outline" className="text-sm">
              كاشير #1
            </Badge>
          </div>
        </header>

        {/* Search */}
        <div className="p-4 border-b border-border bg-card">
          <div className="relative">
            <Barcode className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="ابحث بالاسم أو امسح الباركود..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-12 h-12 text-lg"
              autoFocus
            />
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => addToCart(product)}
              >
                <CardHeader className="p-4 pb-2">
                  <div className="h-20 bg-muted rounded-md flex items-center justify-center mb-2">
                    <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-sm line-clamp-2">{product.name}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-xs text-muted-foreground mb-2">{product.sku}</p>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-primary">{product.price} ج.م</span>
                    <Badge variant="secondary" className="text-xs">{product.stock}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Sidebar */}
      <aside className="w-full md:w-96 border-l border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-bold">السلة</h2>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">السلة فارغة</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.sku}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQty(item.id, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm font-bold w-8 text-center">{item.qty}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQty(item.id, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <span className="font-bold text-primary">
                        {(item.price * item.qty).toLocaleString('ar-EG')} ج.م
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border space-y-3 bg-muted/20">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">المجموع الفرعي:</span>
              <span className="font-medium">{total.toLocaleString('ar-EG')} ج.م</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>الإجمالي:</span>
              <span className="text-primary">{total.toLocaleString('ar-EG')} ج.م</span>
            </div>
          </div>
          <Button className="w-full h-12 text-lg" onClick={handleCheckout}>
            <CreditCard className="w-5 h-5 me-2" />
            إتمام البيع
          </Button>
        </div>
      </aside>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إتمام البيع</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg">المبلغ المستحق:</span>
                <span className="text-2xl font-bold text-primary">{total.toLocaleString('ar-EG')} ج.م</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">طريقة الدفع</label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                  className="h-16"
                  onClick={() => setPaymentMethod('cash')}
                >
                  <Banknote className="w-5 h-5 me-2" />
                  نقدي
                </Button>
                <Button
                  variant={paymentMethod === 'card' ? 'default' : 'outline'}
                  className="h-16"
                  onClick={() => setPaymentMethod('card')}
                >
                  <CreditCard className="w-5 h-5 me-2" />
                  بطاقة
                </Button>
              </div>
            </div>

            <Button className="w-full h-12" onClick={completeSale}>
              تأكيد البيع
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
