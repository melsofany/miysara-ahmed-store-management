#!/usr/bin/env node

/**
 * سكريبت لإضافة متغيرات البيئة على Render عبر API
 * 
 * الاستخدام:
 * node scripts/set-render-env.js --api-key YOUR_KEY --service-id YOUR_ID --url URL --anon-key KEY
 * 
 * أو استخدم متغيرات البيئة:
 * RENDER_API_KEY=... RENDER_SERVICE_ID=... VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... node scripts/set-render-env.js
 */

const https = require('https');
const { URL } = require('url');

class RenderAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async request(method, path, body = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(`https://api.render.com/v1${path}`);
      
      const options = {
        method,
        hostname: url.hostname,
        path: url.pathname + url.search,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(jsonData);
            } else {
              reject(new Error(`API Error (${res.statusCode}): ${JSON.stringify(jsonData)}`));
            }
          } catch (e) {
            reject(new Error(`Failed to parse response: ${data}`));
          }
        });
      });

      req.on('error', reject);

      if (body) {
        req.write(JSON.stringify(body));
      }

      req.end();
    });
  }

  async setEnvironmentVariable(serviceId, key, value) {
    console.log(`\n📝 إضافة متغير: ${key}`);
    
    try {
      // أولاً، دعنا نحاول حذف المتغير إن وجد
      try {
        await this.request('DELETE', `/services/${serviceId}/env-vars/${key}`);
        console.log(`   ✓ تم حذف المتغير القديم`);
      } catch (e) {
        // قد لا يكون المتغير موجوداً، لا بأس
      }

      // الآن أضف المتغير الجديد
      const response = await this.request('POST', `/services/${serviceId}/env-vars`, {
        key,
        value,
      });

      console.log(`   ✓ تم إضافة ${key} بنجاح`);
      return response;
    } catch (error) {
      console.error(`   ✗ خطأ: ${error.message}`);
      throw error;
    }
  }

  async getAllEnvironmentVariables(serviceId) {
    try {
      const response = await this.request('GET', `/services/${serviceId}/env-vars`);
      return response.envVars || [];
    } catch (error) {
      console.error(`خطأ في جلب المتغيرات: ${error.message}`);
      throw error;
    }
  }
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║    Render Environment Variables Setup Script             ║');
  console.log('║    سكريبت إضافة متغيرات البيئة على Render                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // جمع المعاملات من سطر الأوامر أو متغيرات البيئة
  const args = process.argv.slice(2);
  const config = parseArgs(args);

  // التحقق من المعاملات الإلزامية
  if (!config.apiKey) {
    console.error('❌ خطأ: RENDER_API_KEY مفقود');
    console.error('الاستخدام:');
    console.error('  node scripts/set-render-env.js --api-key YOUR_KEY --service-id YOUR_ID --url URL --anon-key KEY\n');
    process.exit(1);
  }

  if (!config.serviceId) {
    console.error('❌ خطأ: RENDER_SERVICE_ID مفقود');
    process.exit(1);
  }

  if (!config.supabaseUrl) {
    console.error('❌ خطأ: VITE_SUPABASE_URL مفقود');
    process.exit(1);
  }

  if (!config.supabaseAnonKey) {
    console.error('❌ خطأ: VITE_SUPABASE_ANON_KEY مفقود');
    process.exit(1);
  }

  const api = new RenderAPI(config.apiKey);

  try {
    console.log('🔄 جاري الاتصال بـ Render API...\n');

    // عرض الخدمة
    const service = await api.request('GET', `/services/${config.serviceId}`);
    console.log(`✓ تم العثور على الخدمة: ${service.name}\n`);

    // عرض المتغيرات الحالية
    console.log('📋 المتغيرات الحالية:');
    const currentVars = await api.getAllEnvironmentVariables(config.serviceId);
    if (currentVars.length > 0) {
      currentVars.forEach(v => {
        const maskedValue = v.value ? v.value.substring(0, 5) + '...' : '(فارغ)';
        console.log(`   • ${v.key} = ${maskedValue}`);
      });
    } else {
      console.log('   (لا توجد متغيرات حالياً)');
    }

    // إضافة المتغيرات الجديدة
    console.log('\n🚀 جاري إضافة المتغيرات الجديدة...');

    const variables = [
      {
        key: 'VITE_SUPABASE_URL',
        value: config.supabaseUrl,
      },
      {
        key: 'VITE_SUPABASE_ANON_KEY',
        value: config.supabaseAnonKey,
      },
    ];

    for (const variable of variables) {
      await api.setEnvironmentVariable(config.serviceId, variable.key, variable.value);
    }

    console.log('\n✅ تم إضافة جميع المتغيرات بنجاح!\n');

    // عرض المتغيرات الجديدة
    console.log('📋 المتغيرات بعد التحديث:');
    const updatedVars = await api.getAllEnvironmentVariables(config.serviceId);
    updatedVars.forEach(v => {
      const maskedValue = v.value ? v.value.substring(0, 5) + '...' : '(فارغ)';
      console.log(`   • ${v.key} = ${maskedValue}`);
    });

    console.log('\n🎉 تم بنجاح!\n');
    console.log('الخطوة التالية:');
    console.log('1. اذهب إلى Render Dashboard');
    console.log('2. اختر الخدمة');
    console.log('3. انقر "Redeploy"');
    console.log('4. انتظر 2-5 دقائق\n');

  } catch (error) {
    console.error('\n❌ خطأ:', error.message);
    process.exit(1);
  }
}

function parseArgs(args) {
  const config = {
    apiKey: process.env.RENDER_API_KEY,
    serviceId: process.env.RENDER_SERVICE_ID,
    supabaseUrl: process.env.VITE_SUPABASE_URL,
    supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY,
  };

  for (let i = 0; i < args.length; i += 2) {
    const flag = args[i];
    const value = args[i + 1];

    switch (flag) {
      case '--api-key':
        config.apiKey = value;
        break;
      case '--service-id':
        config.serviceId = value;
        break;
      case '--url':
        config.supabaseUrl = value;
        break;
      case '--anon-key':
        config.supabaseAnonKey = value;
        break;
    }
  }

  return config;
}

main().catch(error => {
  console.error('خطأ غير متوقع:', error);
  process.exit(1);
});
