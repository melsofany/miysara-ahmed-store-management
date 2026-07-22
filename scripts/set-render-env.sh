#!/bin/bash

# سكريبت bash لإضافة متغيرات البيئة على Render
# الاستخدام: bash scripts/set-render-env.sh

echo "╔════════════════════════════════════════════════════════════╗"
echo "║    Render Environment Variables Setup Script             ║"
echo "║    سكريبت إضافة متغيرات البيئة على Render                  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# التحقق من المعاملات
if [ -z "$RENDER_API_KEY" ]; then
    echo "❌ خطأ: يجب تعيين RENDER_API_KEY"
    echo ""
    echo "الاستخدام:"
    echo "  export RENDER_API_KEY='your-api-key'"
    echo "  export RENDER_SERVICE_ID='your-service-id'"
    echo "  export VITE_SUPABASE_URL='your-url'"
    echo "  export VITE_SUPABASE_ANON_KEY='your-key'"
    echo "  bash scripts/set-render-env.sh"
    echo ""
    exit 1
fi

if [ -z "$RENDER_SERVICE_ID" ]; then
    echo "❌ خطأ: يجب تعيين RENDER_SERVICE_ID"
    exit 1
fi

if [ -z "$VITE_SUPABASE_URL" ]; then
    echo "❌ خطأ: يجب تعيين VITE_SUPABASE_URL"
    exit 1
fi

if [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo "❌ خطأ: يجب تعيين VITE_SUPABASE_ANON_KEY"
    exit 1
fi

# الدالة لإضافة/تحديث متغير
set_env_var() {
    local key=$1
    local value=$2
    
    echo "📝 جاري إضافة: $key"
    
    # حاول حذف المتغير أولاً إن وجد
    curl -s -X DELETE \
        -H "Authorization: Bearer $RENDER_API_KEY" \
        "https://api.render.com/v1/services/$RENDER_SERVICE_ID/env-vars/$key" > /dev/null 2>&1
    
    # أضف المتغير الجديد
    RESPONSE=$(curl -s -X POST \
        -H "Authorization: Bearer $RENDER_API_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"key\":\"$key\",\"value\":\"$value\"}" \
        "https://api.render.com/v1/services/$RENDER_SERVICE_ID/env-vars")
    
    if echo "$RESPONSE" | grep -q "$key"; then
        echo "   ✓ تم إضافة $key بنجاح"
        return 0
    else
        echo "   ✗ فشل إضافة $key"
        echo "   الرد: $RESPONSE"
        return 1
    fi
}

echo "🔄 جاري الاتصال بـ Render API..."
echo ""

# التحقق من الاتصال
VERIFY=$(curl -s -H "Authorization: Bearer $RENDER_API_KEY" \
    "https://api.render.com/v1/services/$RENDER_SERVICE_ID")

if echo "$VERIFY" | grep -q "error"; then
    echo "❌ خطأ في الاتصال: تحقق من RENDER_API_KEY و RENDER_SERVICE_ID"
    echo "الرد: $VERIFY"
    exit 1
fi

SERVICE_NAME=$(echo "$VERIFY" | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "✓ تم العثور على الخدمة: $SERVICE_NAME"
echo ""

# إضافة المتغيرات
echo "🚀 جاري إضافة المتغيرات الجديدة..."
echo ""

set_env_var "VITE_SUPABASE_URL" "$VITE_SUPABASE_URL"
set_env_var "VITE_SUPABASE_ANON_KEY" "$VITE_SUPABASE_ANON_KEY"

echo ""
echo "✅ تم إضافة جميع المتغيرات بنجاح!"
echo ""
echo "🎉 الخطوات التالية:"
echo "1. اذهب إلى Render Dashboard"
echo "2. اختر الخدمة: $SERVICE_NAME"
echo "3. انقر 'Redeploy'"
echo "4. انتظر 2-5 دقائق"
echo ""
