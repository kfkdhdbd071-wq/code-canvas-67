import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, idea, userId } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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
    const htmlResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'أنت وكيل متخصص في كتابة HTML. اكتب كود HTML نظيف ومنظم بناءً على الفكرة المعطاة. استخدم HTML5 الحديث مع اللغة العربية (lang="ar" dir="rtl"). أضف meta tags مناسبة. أرجع الكود فقط بدون شرح.'
          },
          {
            role: 'user',
            content: `اكتب كود HTML كامل لهذه الفكرة: ${idea}`
          }
        ],
        temperature: 0.7,
      }),
    });

    const htmlData = await htmlResponse.json();
    const htmlCode = htmlData.choices[0].message.content.replace(/```html\n?/g, '').replace(/```\n?/g, '');

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
    const cssResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'أنت وكيل متخصص في كتابة CSS. اكتب كود CSS جميل واحترافي يناسب الكود HTML المعطى. استخدم تصميم عصري وألوان متناسقة ودعم RTL. أرجع الكود فقط بدون شرح.'
          },
          {
            role: 'user',
            content: `اكتب كود CSS لهذا HTML:\n\n${htmlCode}\n\nالفكرة: ${idea}`
          }
        ],
        temperature: 0.7,
      }),
    });

    const cssData = await cssResponse.json();
    const cssCode = cssData.choices[0].message.content.replace(/```css\n?/g, '').replace(/```\n?/g, '');

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
    const jsResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'أنت وكيل متخصص في كتابة JavaScript. اكتب كود JavaScript نظيف وفعال يضيف التفاعلية للموقع. استخدم ES6+ الحديث. أرجع الكود فقط بدون شرح.'
          },
          {
            role: 'user',
            content: `اكتب كود JavaScript لهذا الموقع:\n\nHTML:\n${htmlCode}\n\nCSS:\n${cssCode}\n\nالفكرة: ${idea}`
          }
        ],
        temperature: 0.7,
      }),
    });

    const jsData = await jsResponse.json();
    const jsCode = jsData.choices[0].message.content.replace(/```javascript\n?/g, '').replace(/```js\n?/g, '').replace(/```\n?/g, '');

    await supabase
      .from('projects')
      .update({ 
        js_code: jsCode,
        ai_agents_status: 'review_agent',
        ai_agents_progress: 80
      })
      .eq('id', projectId);

    // Agent 4: Review Agent
    console.log('Starting Review Agent...');
    const reviewResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'أنت وكيل متخصص في مراجعة الأكواد. راجع الأكواد وأصلح أي أخطاء. تأكد من أن الكود نظيف ويعمل بشكل صحيح. أرجع الأكواد المحسنة بصيغة JSON: {"html": "...", "css": "...", "js": "..."}'
          },
          {
            role: 'user',
            content: `راجع وحسن هذه الأكواد:\n\nHTML:\n${htmlCode}\n\nCSS:\n${cssCode}\n\nJavaScript:\n${jsCode}`
          }
        ],
        temperature: 0.3,
      }),
    });

    const reviewData = await reviewResponse.json();
    let reviewedCode = reviewData.choices[0].message.content;
    
    // Extract JSON from markdown code blocks if present
    reviewedCode = reviewedCode.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    const reviewed = JSON.parse(reviewedCode);

    await supabase
      .from('projects')
      .update({ 
        html_code: reviewed.html || htmlCode,
        css_code: reviewed.css || cssCode,
        js_code: reviewed.js || jsCode,
        ai_agents_status: 'publish_agent',
        ai_agents_progress: 95
      })
      .eq('id', projectId);

    // Agent 5: Publish Agent
    console.log('Starting Publish Agent...');
    await supabase
      .from('projects')
      .update({ 
        is_published: true,
        ai_agents_status: 'completed',
        ai_agents_progress: 100
      })
      .eq('id', projectId);

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
