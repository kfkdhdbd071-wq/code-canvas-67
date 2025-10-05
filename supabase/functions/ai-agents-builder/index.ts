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
    
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!GEMINI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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
    
    const htmlResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `أنت وكيل متخصص في كتابة HTML عصري ومبدع. اكتب كود HTML5 حديث ومنظم بناءً على الفكرة المعطاة:

- استخدم HTML5 الحديث مع اللغة العربية (lang="ar" dir="rtl")
- أضف meta tags مناسبة للـ SEO
- استخدم semantic HTML (header, main, section, article, footer)
- أضف data attributes للعناصر التفاعلية
- استخدم بنية واضحة ومنظمة تسهل التنسيق والتفاعل
- أضف classes وصفية للعناصر المهمة

الفكرة: ${idea}

أرجع الكود فقط بدون شرح أو تعليقات.`
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

    const htmlData = await htmlResponse.json();
    const htmlCode = htmlData.candidates[0].content.parts[0].text.replace(/```html\n?/g, '').replace(/```\n?/g, '');

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
    
    const cssResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `أنت وكيل متخصص في كتابة CSS مبدع وعصري. اكتب كود CSS احترافي ومميز يناسب الكود HTML المعطى:

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

HTML:
${htmlCode}

الفكرة: ${idea}

أرجع الكود فقط بدون شرح أو تعليقات.`
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

    const cssData = await cssResponse.json();
    const cssCode = cssData.candidates[0].content.parts[0].text.replace(/```css\n?/g, '').replace(/```\n?/g, '');

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
    
    const jsResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `أنت وكيل متخصص في كتابة JavaScript حديث وتفاعلي. اكتب كود JavaScript مميز يضيف تفاعلية قوية للموقع:

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
- تأكد من accessibility (ARIA labels)
- أضف error handling مناسب

أمثلة للتفاعلات المطلوبة:
- Scroll reveal animations للعناصر
- Counter animations للأرقام
- Typing effect للنصوص المهمة
- Image lazy loading
- Form validation مع feedback مباشر
- Modal/Dialog interactions
- Smooth page transitions
- Interactive hover effects

HTML:
${htmlCode}

CSS:
${cssCode}

الفكرة: ${idea}

أرجع الكود فقط بدون شرح أو تعليقات.`
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

    const jsData = await jsResponse.json();
    const jsCode = jsData.candidates[0].content.parts[0].text.replace(/```javascript\n?/g, '').replace(/```js\n?/g, '').replace(/```\n?/g, '');

    await addAgentMessage('JS Agent', 'ضفت كل التفاعلات المطلوبة 🎯');
    
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
    await addAgentMessage('Review Agent', 'خليني أراجع الكود وأتأكد إن كل حاجة تمام 🔍');
    
    const reviewResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`, {
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

    const reviewData = await reviewResponse.json();
    let reviewedCode = reviewData.candidates[0].content.parts[0].text;
    
    // Extract JSON from markdown code blocks if present
    reviewedCode = reviewedCode.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    let reviewed;
    try {
      reviewed = JSON.parse(reviewedCode);
    } catch (parseError) {
      console.error('Failed to parse review JSON, retrying with cleaned text:', parseError);
      // Try to extract JSON object from text
      const jsonMatch = reviewedCode.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          reviewed = JSON.parse(jsonMatch[0]);
        } catch (retryError) {
          console.error('Retry failed, using original codes:', retryError);
          // Fallback to original codes if parsing fails
          reviewed = {
            html: htmlCode,
            css: cssCode,
            js: jsCode
          };
        }
      } else {
        // No JSON found, use original codes
        reviewed = {
          html: htmlCode,
          css: cssCode,
          js: jsCode
        };
      }
    }

    await addAgentMessage('Review Agent', 'راجعت كل حاجة وحسنت الكود، جاهز للنشر! 👍');
    
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
