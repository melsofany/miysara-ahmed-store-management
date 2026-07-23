import React, { useState } from 'react';
import { useProducts, useCreateProduct, useUpdateProduct } from '@/hooks/use-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Edit, Trash2, Package } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function Products() {
  const { data: products, isLoading } = useProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name_ar: '',
    sku: '',
    price: '',
    cost: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingProduct) {
        await updateProduct.mutateAsync({
          id: editingProduct.id,
          data: {
            name_ar: formData.name_ar,
            sku: formData.sku,
            price: Number(formData.price),
            cost: Number(formData.cost),
          }
        });
        toast({ title: 'تم تحديث المنتج بنجاح' });
      } else {
        await createProduct.mutateAsync({
          name_ar: formData.name_ar,
          sku: formData.sku,
          price: Number(formData.price),
          cost: Number(formData.cost),
          is_active: true,
        });
        toast({ title: 'تم إضافة المنتج بنجاح' });
      }
      
      setDialogOpen(false);
      setEditingProduct(null);
      setFormData({ name_ar: '', sku: '', price: '', cost: '' });
    } catch (error) {
      toast({ 
        variant: 'destructive',
        title: 'حدث خطأ',
        description: 'لم نتمكن من حفظ المنتج'
      });
    }
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name_ar: product.name_ar || '',
      sku: product.sku || '',
      price: product.price?.toString() || '',
      cost: product.cost?.toString() || '',
    });
    setDialogOpen(true);
  };

  const filteredProducts = products?.filter((p) => 
    p.name_ar?.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-10 bg-muted rounded animate-pulse" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-20" />
              <CardContent className="h-20" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-foreground">المنتجات</h1>
        
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingProduct(null);
            setFormData({ name_ar: '', sku: '', price: '', cost: '' });
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 me-2" />
              إضافة منتج
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name_ar">اسم المنتج</Label>
                <Input
                  id="name_ar"
                  value={formData.name_ar}
                  onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">رمز المنتج (SKU)</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">سعر البيع</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost">التكلفة</Label>
                  <Input
                    id="cost"
                    type="number"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={createProduct.isPending || updateProduct.isPending}>
                {editingProduct ? 'حفظ التعديلات' : 'إضافة المنتج'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="البحث عن المنتجات..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-10"
        />
      </div>

      {filteredProducts && filteredProducts.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <Card key={product.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{product.name_ar}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{product.sku}</p>
                  </div>
                  <Badge variant={product.is_active ? "default" : "secondary"}>
                    {product.is_active ? 'نشط' : 'غير نشط'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">السعر:</span>
                    <span className="font-bold text-primary">{product.price?.toLocaleString('ar-EG')} ج.م</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">التكلفة:</span>
                    <span className="font-medium">{product.cost?.toLocaleString('ar-EG')} ج.م</span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(product)}>
                      <Edit className="w-3 h-3 me-1" />
                      تعديل
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">لا يوجد منتجات</h3>
            <p className="text-sm text-muted-foreground mb-4">ابدأ بإضافة منتجك الأول</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
