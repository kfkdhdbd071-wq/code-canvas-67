import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to get current API key based on rotation
async function getCurrentApiKey(supabase: any) {
  const { data: rotation, error } = await supabase
    .from('api_key_rotation')
    .select('current_key_index, last_rotation_time')
    .eq('service_name', 'gemini')
    .single();

  if (error) {
    console.error('Error fetching rotation data:', error);
    return { key: Deno.env.get('GEMINI_API_KEY'), index: 1 };
  }

  const now = new Date();
  const lastRotation = new Date(rotation.last_rotation_time);
  const hoursSinceRotation = (now.getTime() - lastRotation.getTime()) / (1000 * 60 * 60);

  // If more than 1 hour has passed, rotate to next key
  if (hoursSinceRotation >= 1) {
    const nextIndex = rotation.current_key_index + 1;
    const nextKey = Deno.env.get(`GEMINI_API_KEY_${nextIndex}`);
    
    // If next key exists, use it and update rotation
    if (nextKey) {
      await supabase
        .from('api_key_rotation')
        .update({
          current_key_index: nextIndex,
          last_rotation_time: now.toISOString()
        })
        .eq('service_name', 'gemini');
      
      console.log(`Rotated to GEMINI_API_KEY_${nextIndex} after 1 hour`);
      return { key: nextKey, index: nextIndex };
    } else {
      // No more keys, reset to 1
      await supabase
        .from('api_key_rotation')
        .update({
          current_key_index: 1,
          last_rotation_time: now.toISOString()
        })
        .eq('service_name', 'gemini');
      
      console.log('Reset to GEMINI_API_KEY (no more keys available)');
      return { key: Deno.env.get('GEMINI_API_KEY'), index: 1 };
    }
  }

  // Use current key
  const currentIndex = rotation.current_key_index;
  const currentKey = currentIndex === 1 
    ? Deno.env.get('GEMINI_API_KEY')
    : Deno.env.get(`GEMINI_API_KEY_${currentIndex}`);
  
  return { key: currentKey, index: currentIndex };
}

// Helper function to try next API key on 429 error
async function tryNextApiKey(supabase: any, currentIndex: number) {
  const nextIndex = currentIndex + 1;
  const nextKey = Deno.env.get(`GEMINI_API_KEY_${nextIndex}`);
  
  if (nextKey) {
    await supabase
      .from('api_key_rotation')
      .update({
        current_key_index: nextIndex,
        last_rotation_time: new Date().toISOString()
      })
      .eq('service_name', 'gemini');
    
    console.log(`Switched to GEMINI_API_KEY_${nextIndex} due to quota error`);
    return { key: nextKey, index: nextIndex };
  } else {
    // Reset to first key
    await supabase
      .from('api_key_rotation')
      .update({
        current_key_index: 1,
        last_rotation_time: new Date().toISOString()
      })
      .eq('service_name', 'gemini');
    
    console.log('Reset to GEMINI_API_KEY due to quota error (no more keys)');
    return { key: Deno.env.get('GEMINI_API_KEY'), index: 1 };
  }
}

// Lovable AI fallback (OpenAI-compatible via Lovable gateway)
async function callLovableAI(prompt: string, maxTokens = 8192): Promise<string | null> {
  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return null;
    }
    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'أنت وكيل يبني كود نظيف بدون شروحات. أرجع الكود فقط بدون أي علامات ```.' },
          { role: 'user', content: prompt }
        ],
      }),
    });
    if (!resp.ok) {
      console.error('Lovable AI error:', resp.status, await resp.text());
      return null;
    }
    const json = await resp.json();
    const content = json?.choices?.[0]?.message?.content;
    if (typeof content === 'string' && content.trim()) {
      return content.replace(/```[a-zA-Z]*\n?/g, '').replace(/```\n?/g, '');
    }
    return null;
  } catch (e) {
    console.error('Lovable AI exception:', e);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, idea, userId } = await req.json();
    
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Get current API key based on rotation
    let { key: GEMINI_API_KEY, index: currentKeyIndex } = await getCurrentApiKey(supabase);

    // Helper function to add agent messages
    const addAgentMessage = async (agent: string, message: string) => {
      const { data: project } = await supabase
        .from('projects')
        .select('agent_messages')
        .eq('id', projectId)
        .single();
      
      const messages = project?.agent_messages || [];
      messages.push({ agent, message, timestamp: new Date().toISOString() });
      
      await supabase
        .from('projects')
        .update({ agent_messages: messages })
        .eq('id', projectId);
    };

    // Update project status
    await supabase
      .from('projects')
      .update({ 
        ai_agents_status: 'html_agent',
        ai_agents_progress: 10
      })
      .eq('id', projectId);

    // Agent 1: HTML Agent
    console.log('Starting HTML Agent...');
    await addAgentMessage('HTML Agent', 'بدأت العمل على بناء هيكل الصفحة 🚀');
    
    const htmlPrompt = `أنت وكيل متخصص في كتابة HTML عصري ومبدع. اكتب كود HTML5 حديث ومنظم بناءً على الفكرة المعطاة:

- استخدم HTML5 الحديث مع اللغة العربية (lang="ar" dir="rtl")
- أضف meta tags مناسبة للـ SEO
- استخدم semantic HTML (header, main, section, article, footer)
- أضف data attributes للعناصر التفاعلية
- استخدم بنية واضحة ومنظمة تسهل التنسيق والتفاعل
- أضف classes وصفية للعناصر المهمة

⚠️ CRITICAL - المحتوى:
- اكتب محتوى حقيقي ومفصل وواقعي 100%
- ممنوع منعاً باتاً استخدام placeholders أو أمثلة وهمية
- ممنوع كتابة "المثال 1" أو "الموقع 1" أو "المقال 1" أو "العنصر 1"
- اكتب أسماء حقيقية ومعلومات واقعية تناسب الفكرة
- إذا كانت الفكرة عن مواقع، اكتب أسماء مواقع حقيقية موجودة
- إذا كانت عن منتجات، اكتب أسماء منتجات حقيقية
- إذا كانت عن أشخاص، اكتب أسماء أشخاص حقيقيين
- اكتب محتوى غني ومفيد وكامل بدون اختصارات
- كل عنوان، نص، وصف يجب أن يكون محتوى حقيقي مكتوب بالكامل

الفكرة: ${idea}

أرجع الكود فقط بدون شرح أو تعليقات.`;

    let htmlResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: htmlPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      }),
    });

    // Handle 429 error by trying next API key
    if (htmlResponse.status === 429) {
      console.log('HTML Agent: Quota exceeded, trying next API key...');
      const nextKey = await tryNextApiKey(supabase, currentKeyIndex);
      GEMINI_API_KEY = nextKey.key;
      currentKeyIndex = nextKey.index;
      // Retry with new key
      htmlResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: htmlPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          }
        }),
      });
    }

    const htmlData = await htmlResponse.json();
    let htmlCode: string | null = null;
    if (htmlData.candidates && htmlData.candidates[0]?.content) {
      htmlCode = htmlData.candidates[0].content.parts[0].text.replace(/```html\n?/g, '').replace(/```\n?/g, '');
    } else {
      console.error('Invalid HTML response:', JSON.stringify(htmlData));
      const lovableHTML = await callLovableAI(htmlPrompt, 8192);
      if (lovableHTML) {
        htmlCode = lovableHTML;
        await addAgentMessage('HTML Agent', 'استخدمنا مزود بديل مؤقتًا بسبب حد الاستخدام ✅');
      } else {
        throw new Error('فشل في الحصول على رد من HTML Agent');
      }
    }

    await addAgentMessage('HTML Agent', 'انتهيت من بناء الهيكل الأساسي للصفحة ✅');
    
    await supabase
      .from('projects')
      .update({ 
        html_code: htmlCode,
        ai_agents_status: 'css_agent',
        ai_agents_progress: 35
      })
      .eq('id', projectId);

    // Agent 2: CSS Agent
    console.log('Starting CSS Agent...');
    await addAgentMessage('CSS Agent', 'تمام! هبدأ أنسق التصميم دلوقتي 🎨');
    
    const cssPrompt = `أنت وكيل متخصص في كتابة CSS مبدع وعصري. اكتب كود CSS احترافي ومميز يناسب الكود HTML المعطى:

CRITICAL CSS REQUIREMENTS:
- استخدم تصميم عصري جداً مع ألوان متناسقة وجذابة
- أضف gradients مميزة وجميلة (linear-gradient, radial-gradient)
- استخدم shadows متعددة المستويات لعمق التصميم (box-shadow, text-shadow)
- أضف animations و transitions سلسة على جميع العناصر التفاعلية
- استخدم modern CSS features (backdrop-filter, clip-path, transform)
- أضف hover effects مميزة (scale, rotate, color changes)
- استخدم keyframe animations للعناصر المهمة (@keyframes)
- أضف smooth scrolling و scroll animations
- استخدم CSS Grid و Flexbox للتخطيط
- دعم كامل لـ RTL والعربية
- تصميم responsive كامل
- استخدم CSS variables للألوان والقيم المتكررة

مثال للأنيميشن المطلوب:
- fade-in animations للعناصر عند الظهور
- slide-in من الجوانب
- pulse و bounce للأزرار
- gradient animations للخلفيات
- hover transformations

⚠️ CRITICAL - المحتوى:
- صمم بناءً على المحتوى الحقيقي الموجود في HTML
- لا تستخدم ألوان عامة، اختر ألوان تناسب المحتوى الفعلي

HTML:
${htmlCode}

الفكرة: ${idea}

أرجع الكود فقط بدون شرح أو تعليقات.`;

    let cssResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: cssPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      }),
    });

    // Handle 429 error by trying next API key
    if (cssResponse.status === 429) {
      console.log('CSS Agent: Quota exceeded, trying next API key...');
      const nextKey = await tryNextApiKey(supabase, currentKeyIndex);
      GEMINI_API_KEY = nextKey.key;
      currentKeyIndex = nextKey.index;
      // Retry with new key
      cssResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: cssPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          }
        }),
      });
    }

    const cssData = await cssResponse.json();
    let cssCode: string | null = null;
    if (!cssData.candidates || !cssData.candidates[0] || !cssData.candidates[0].content) {
      console.error('Invalid CSS response:', JSON.stringify(cssData));
      const lovableCSS = await callLovableAI(cssPrompt, 8192);
      if (lovableCSS) {
        cssCode = lovableCSS;
        await addAgentMessage('CSS Agent', 'استخدمنا مزود بديل مؤقتًا بسبب حد الاستخدام ✅');
      } else {
        throw new Error('فشل في الحصول على رد من CSS Agent');
      }
    } else {
      cssCode = cssData.candidates[0].content.parts[0].text.replace(/```css\n?/g, '').replace(/```\n?/g, '');
    }

    await addAgentMessage('CSS Agent', 'خلصت التنسيق والصفحة بقت جميلة 💅');
    
    await supabase
      .from('projects')
      .update({ 
        css_code: cssCode,
        ai_agents_status: 'js_agent',
        ai_agents_progress: 60
      })
      .eq('id', projectId);

    // Agent 3: JavaScript Agent
    console.log('Starting JavaScript Agent...');
    await addAgentMessage('JS Agent', 'حلو! دوري دلوقتي أضيف التفاعلية ⚡');
    
    const jsPrompt = `أنت وكيل متخصص في كتابة JavaScript حديث وتفاعلي. اكتب كود JavaScript مميز يضيف تفاعلية قوية للموقع:

CRITICAL JS REQUIREMENTS:
- استخدم ES6+ الحديث (const, let, arrow functions, async/await)
- أضف تفاعلات ديناميكية وسلسة لجميع العناصر
- استخدم Intersection Observer لـ scroll animations
- أضف smooth scrolling للروابط الداخلية
- استخدم event delegation للأداء الأفضل
- أضف loading states و transitions بين الحالات
- استخدم requestAnimationFrame للأنيميشن السلس
- أضف parallax effects إذا كان مناسباً
- استخدم localStorage لحفظ التفضيلات إن أمكن
- أضف keyboard navigation support
- Form validation مع رسائل واضحة
- Dynamic content loading
- Smooth page transitions
- Interactive hover effects

⚠️ CRITICAL - المحتوى:
- إذا كان هناك محتوى ديناميكي في JS (arrays, objects)، اكتب محتوى حقيقي
- ممنوع استخدام "Item 1" أو "Example 1" في البيانات
- اكتب بيانات واقعية تناسب الفكرة

HTML:
${htmlCode}

CSS:
${cssCode}

الفكرة: ${idea}

أرجع الكود فقط بدون شرح أو تعليقات.`;

    let jsResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: jsPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      }),
    });

    // Handle 429 error by trying next API key
    if (jsResponse.status === 429) {
      console.log('JS Agent: Quota exceeded, trying next API key...');
      const nextKey = await tryNextApiKey(supabase, currentKeyIndex);
      GEMINI_API_KEY = nextKey.key;
      currentKeyIndex = nextKey.index;
      // Retry with new key
      jsResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: jsPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          }
        }),
      });
    }

    const jsData = await jsResponse.json();
    let jsCode: string | null = null;
    if (!jsData.candidates || !jsData.candidates[0] || !jsData.candidates[0].content) {
      console.error('Invalid JS response:', JSON.stringify(jsData));
      const lovableJS = await callLovableAI(jsPrompt, 8192);
      if (lovableJS) {
        jsCode = lovableJS;
        await addAgentMessage('JS Agent', 'استخدمنا مزود بديل مؤقتًا بسبب حد الاستخدام ✅');
      } else {
        throw new Error('فشل في الحصول على رد من JS Agent');
      }
    } else {
      jsCode = jsData.candidates[0].content.parts[0].text.replace(/```javascript\n?/g, '').replace(/```js\n?/g, '').replace(/```\n?/g, '');
    }

    await addAgentMessage('JS Agent', 'ضفت كل التفاعلات المطلوبة 🎯');
    
    await supabase
      .from('projects')
      .update({ 
        js_code: jsCode,
        ai_agents_status: 'review_agent',
        ai_agents_progress: 80
      })
      .eq('id', projectId);

    let reviewResponse: Response;
    let reviewAttempts = 0;
    const maxReviewAttempts = 3;

    while (true) {
      console.log(`Starting Review Agent... (attempt ${reviewAttempts + 1})`);
      await addAgentMessage('Review Agent', reviewAttempts === 0
        ? 'خليني أراجع الكود وأتأكد إن كل حاجة تمام 🔍'
        : `إعادة المحاولة بسبب حد الاستخدام... (محاولة ${reviewAttempts + 1}) ⏳`);

      reviewResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `أنت وكيل متخصص في مراجعة وتحسين الأكواد. راجع الأكواد التالية وحسّنها:

REVIEW CHECKLIST:
- تأكد من وجود animations و transitions كافية
- تحقق من جودة التصميم والألوان والـ gradients
- تأكد من وجود hover effects مميزة
- راجع الـ JavaScript للتأكد من التفاعلية القوية
- أضف أي أنيميشن أو تفاعل ناقص
- حسّن الأداء (optimize animations, use transform instead of position)
- تأكد من accessibility و semantic HTML
- راجع responsive design
- تأكد من RTL support
- أصلح أي أخطاء في الكود
- حسّن structure و readability

⚠️ CRITICAL - المحتوى:
- تأكد من أن كل المحتوى حقيقي وليس placeholder
- إذا وجدت "المثال 1" أو "الموقع 1" أو أي placeholder، استبدله بمحتوى حقيقي
- اكتب محتوى واقعي ومفصل يناسب الفكرة
- كل عنوان ونص يجب أن يكون محتوى حقيقي كامل

HTML:
${htmlCode}

CSS:
${cssCode}

JavaScript:
${jsCode}

أرجع الأكواد المحسنة بصيغة JSON فقط بدون أي شرح أو تعليقات:
{"html": "...", "css": "...", "js": "..."}`
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          }
        }),
      });

      if (reviewResponse.status === 429 && reviewAttempts < maxReviewAttempts - 1) {
        console.log('Review Agent: Quota exceeded, trying next API key with backoff...');
        const nextKey = await tryNextApiKey(supabase, currentKeyIndex);
        GEMINI_API_KEY = nextKey.key;
        currentKeyIndex = nextKey.index;
        // Exponential backoff
        const backoffMs = 1500 * (reviewAttempts + 1);
        await new Promise((res) => setTimeout(res, backoffMs));
        reviewAttempts++;
        continue;
      }

      break;
    }

    let reviewed: { html: string; css: string; js: string } | null = null;

    try {
      if (reviewResponse.ok) {
        const reviewData = await reviewResponse.json();
        if (reviewData.candidates && reviewData.candidates[0]?.content?.parts?.[0]?.text) {
          let reviewedCode = reviewData.candidates[0].content.parts[0].text;
          // Extract JSON from markdown code blocks if present
          reviewedCode = reviewedCode.replace(/```json\n?/g, '').replace(/```\n?/g, '');

          try {
            reviewed = JSON.parse(reviewedCode);
          } catch {
            // Try to extract JSON object from text
            const jsonMatch = reviewedCode.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              try {
                reviewed = JSON.parse(jsonMatch[0]);
              } catch {
                reviewed = null;
              }
            }
          }
        }
      } else {
        console.error('Review Agent HTTP error:', reviewResponse.status, await reviewResponse.text());
      }
    } catch (e) {
      console.error('Review Agent parsing error:', e);
    }

    if (!reviewed) {
      console.error('Review Agent unavailable or invalid response, falling back to original code.');
      await addAgentMessage('Review Agent', '⚠️ حدثت مشكلة في خدمة المراجعة (مثلاً حد الاستخدام). تم النشر باستخدام النسخة الحالية.');
      reviewed = {
        html: htmlCode,
        css: cssCode,
        js: jsCode,
      };
    } else {
      await addAgentMessage('Review Agent', 'راجعت كل حاجة وحسنت الكود، جاهز للنشر! 👍');
    }

    await supabase
      .from('projects')
      .update({
        html_code: reviewed.html || htmlCode,
        css_code: reviewed.css || cssCode,
        js_code: reviewed.js || jsCode,
        ai_agents_status: 'publish_agent',
        ai_agents_progress: 95,
      })
      .eq('id', projectId);

    // Agent 5: Publish Agent
    console.log('Starting Publish Agent...');
    await addAgentMessage('Publish Agent', 'بنشر المشروع دلوقتي 🚀');
    
    await supabase
      .from('projects')
      .update({ 
        is_published: true,
        ai_agents_status: 'completed',
        ai_agents_progress: 100
      })
      .eq('id', projectId);

    await addAgentMessage('Publish Agent', 'تم النشر بنجاح! المشروع جاهز 🎉');

    // Extract relative links and create subpages
    console.log('Extracting relative links for subpages...');
    const htmlContent = reviewed.html || htmlCode;
    const hrefRegex = /<a[^>]+href=["']([^"']+)["']/gi;
    const relativeLinks = new Set<string>();
    
    let match;
    while ((match = hrefRegex.exec(htmlContent)) !== null) {
      const href = match[1].trim();
      // Only process relative links (not http/https/mailto/#/javascript:)
      if (
        href && 
        !href.startsWith('http://') && 
        !href.startsWith('https://') && 
        !href.startsWith('mailto:') && 
        !href.startsWith('tel:') && 
        !href.startsWith('#') && 
        !href.startsWith('javascript:') &&
        href !== '/' &&
        href !== './' &&
        href !== '../'
      ) {
        // Normalize the link (remove query params and anchors for route matching)
        const normalizedLink = href.split('?')[0].split('#')[0];
        if (normalizedLink && normalizedLink.length > 0) {
          relativeLinks.add(normalizedLink.startsWith('/') ? normalizedLink : `/${normalizedLink}`);
        }
      }
    }

    console.log(`Found ${relativeLinks.size} relative links:`, Array.from(relativeLinks));

    if (relativeLinks.size > 0) {
      await addAgentMessage('Publish Agent', `🔍 وجدت ${relativeLinks.size} صفحة فرعية، جاري إنشائها بمحتوى ذكي...`);
      
      // Get existing subpages to avoid duplicates
      const { data: existingSubpages } = await supabase
        .from('projects')
        .select('subpage_route')
        .eq('parent_project_id', projectId)
        .eq('is_subpage', true);

      const existingRoutes = new Set(
        (existingSubpages || []).map(sp => sp.subpage_route)
      );

      // Filter new links
      const newLinks = Array.from(relativeLinks).filter(link => !existingRoutes.has(link));
      
      console.log(`Creating ${newLinks.length} new subpages with AI-generated content...`);
      
      if (newLinks.length > 0) {
        // Generate content for each subpage using Lovable AI
        const subpagesToCreate = [];
        
        for (const link of newLinks) {
          const pageName = link.replace(/\//g, '').replace('.html', '').replace(/-/g, ' ').replace(/_/g, ' ');
          console.log(`Generating content for subpage: ${pageName}`);
          
          // Create a prompt for generating subpage content
          const subpagePrompt = `أنت مطور ويب محترف. المطلوب: إنشاء صفحة HTML كاملة ومفصلة لصفحة بعنوان "${pageName}".

السياق: هذه الصفحة جزء من مشروع بعنوان "${idea}".

المحتوى الأساسي للمشروع:
${htmlContent.substring(0, 2000)}

المطلوب:
1. إنشاء صفحة HTML كاملة ومتكاملة بمحتوى حقيقي ومفصل (ليس placeholder)
2. المحتوى يجب أن يكون متناسق مع فكرة المشروع الأساسي
3. إضافة عناصر navigation للعودة للصفحة الرئيسية
4. استخدام نفس النمط والأسلوب من الصفحة الرئيسية
5. المحتوى بالعربية ومفصل (على الأقل 500 كلمة)
6. إضافة meta tags مناسبة للـ SEO
7. إضافة روابط داخلية لصفحات أخرى إذا كان مناسباً

تأكد من أن المحتوى:
- واقعي ومفيد للمستخدمين
- منظم باستخدام headings و paragraphs
- يحتوي على معلومات قيمة وليس نص تجريبي
- متوافق مع موضوع "${pageName}"

أرجع فقط كود HTML الكامل بدون أي شرح أو markdown.`;

          try {
            const aiHtml = await callLovableAI(subpagePrompt, 16000);
            
            if (aiHtml && aiHtml.trim().length > 100) {
              console.log(`✅ Generated ${aiHtml.length} chars for ${pageName}`);
              subpagesToCreate.push({
                user_id: userId,
                parent_project_id: projectId,
                is_subpage: true,
                subpage_route: link,
                project_name: `${idea} - ${pageName}`,
                html_code: aiHtml,
                css_code: reviewed.css || cssCode,
                js_code: reviewed.js || jsCode,
                is_published: true,
                show_in_community: false
              });
            } else {
              console.log(`⚠️ AI failed for ${pageName}, using fallback`);
              // Fallback with better default content
              subpagesToCreate.push({
                user_id: userId,
                parent_project_id: projectId,
                is_subpage: true,
                subpage_route: link,
                project_name: `${idea} - ${pageName}`,
                html_code: `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="صفحة ${pageName} - جزء من ${idea}">
    <title>${pageName} - ${idea}</title>
</head>
<body>
    <header>
        <nav>
            <a href="/">🏠 الرئيسية</a>
        </nav>
    </header>
    <main>
        <h1>${pageName}</h1>
        <p>مرحباً بك في صفحة ${pageName}</p>
        <p>هذه الصفحة جزء من مشروع ${idea}</p>
        <section>
            <h2>محتوى الصفحة</h2>
            <p>يمكنك تخصيص محتوى هذه الصفحة من خلال المحرر.</p>
        </section>
    </main>
    <footer>
        <p>&copy; 2024 ${idea}</p>
    </footer>
</body>
</html>`,
                css_code: reviewed.css || cssCode,
                js_code: reviewed.js || jsCode,
                is_published: true,
                show_in_community: false
              });
            }
          } catch (err) {
            console.error(`Error generating content for ${pageName}:`, err);
            // Use fallback
            subpagesToCreate.push({
              user_id: userId,
              parent_project_id: projectId,
              is_subpage: true,
              subpage_route: link,
              project_name: `${idea} - ${pageName}`,
              html_code: `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pageName}</title>
</head>
<body>
    <h1>${pageName}</h1>
    <a href="/">العودة للرئيسية</a>
</body>
</html>`,
              css_code: reviewed.css || cssCode,
              js_code: reviewed.js || jsCode,
              is_published: true,
              show_in_community: false
            });
          }
        }

        // Insert all subpages
        if (subpagesToCreate.length > 0) {
          console.log(`Inserting ${subpagesToCreate.length} subpages into database...`);
          const { data: insertedData, error: subpagesError } = await supabase
            .from('projects')
            .insert(subpagesToCreate)
            .select('id, subpage_route');

          if (subpagesError) {
            console.error('Error creating subpages:', subpagesError);
            await addAgentMessage('Publish Agent', `⚠️ حدث خطأ في إنشاء الصفحات الفرعية: ${subpagesError.message}`);
          } else {
            console.log(`✅ Created ${insertedData?.length || 0} subpages successfully:`, insertedData);
            await addAgentMessage('Publish Agent', `✅ تم إنشاء ${insertedData?.length || 0} صفحة فرعية بمحتوى ذكي ومفصل!`);
          }
        }
      } else {
        console.log('All subpages already exist');
        await addAgentMessage('Publish Agent', 'جميع الصفحات الفرعية موجودة مسبقاً ✓');
      }
    } else {
      console.log('No relative links found in HTML');
      await addAgentMessage('Publish Agent', 'لم يتم العثور على روابط لإنشاء صفحات فرعية');
    }

    console.log('All agents completed successfully!');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'تم بناء ونشر المشروع بنجاح',
        html: reviewed.html || htmlCode,
        css: reviewed.css || cssCode,
        js: reviewed.js || jsCode
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in AI agents:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
