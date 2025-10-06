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
    const { projectId, message, currentCode } = await req.json();
    
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    
    if (!GEMINI_API_KEY) {
      throw new Error('Missing GEMINI_API_KEY');
    }

    console.log('Processing modification request:', message);

    // Call Gemini API to modify the code based on user request
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `أنت وكيل ذكاء اصطناعي متخصص في تعديل مواقع الويب بناءً على طلبات المستخدمين.

الأكواد الحالية للمشروع:

HTML:
\`\`\`html
${currentCode.html}
\`\`\`

CSS:
\`\`\`css
${currentCode.css}
\`\`\`

JavaScript:
\`\`\`javascript
${currentCode.js}
\`\`\`

طلب المستخدم: ${message}

مهمتك:
1. فهم طلب المستخدم بدقة
2. تعديل الكود المناسب (HTML أو CSS أو JavaScript أو الثلاثة)
3. الحفاظ على الكود الموجود وإضافة/تعديل فقط ما هو مطلوب
4. التأكد من أن التعديلات تعمل بشكل صحيح ومتناسقة مع باقي الكود
5. استخدام تقنيات حديثة وأفضل الممارسات
6. إضافة تأثيرات وأنيميشن جميلة إذا كان مناسباً
7. التأكد من دعم اللغة العربية (RTL) في جميع التعديلات

⚠️ CRITICAL - المحتوى:
- اكتب دائماً محتوى حقيقي ومفصل وواقعي 100%
- ممنوع منعاً باتاً استخدام placeholders أو أمثلة وهمية
- ممنوع كتابة "المثال 1" أو "الموقع 1" أو "المقال 1" أو "العنصر 1"
- اكتب أسماء حقيقية ومعلومات واقعية تناسب طلب المستخدم
- إذا طلب المستخدم محتوى عن مواقع، اكتب أسماء مواقع حقيقية موجودة
- إذا طلب محتوى عن منتجات، اكتب أسماء منتجات حقيقية
- إذا طلب محتوى عن أشخاص، اكتب أسماء أشخاص حقيقيين
- اكتب محتوى غني ومفيد وكامل بدون اختصارات
- كل عنوان، نص، وصف يجب أن يكون محتوى حقيقي مكتوب بالكامل

أرجع الأكواد المعدلة بصيغة JSON فقط بدون أي شرح أو تعليقات:
{
  "html": "الكود HTML الكامل المعدل",
  "css": "الكود CSS الكامل المعدل",
  "js": "الكود JavaScript الكامل المعدل",
  "message": "رسالة قصيرة توضح ما تم تعديله"
}`
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

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', response.status, errorData);
      throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('Invalid Gemini response:', JSON.stringify(data));
      throw new Error('Invalid response from Gemini API');
    }
    
    let resultText = data.candidates[0].content.parts[0].text;
    
    // Extract JSON from markdown code blocks if present
    resultText = resultText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    let result;
    try {
      result = JSON.parse(resultText);
    } catch (parseError) {
      console.error('Failed to parse JSON:', resultText);
      // Try to extract JSON object from text
      const jsonMatch = resultText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse AI response');
      }
    }

    console.log('Modification completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        code: {
          html: result.html || currentCode.html,
          css: result.css || currentCode.css,
          js: result.js || currentCode.js
        },
        message: result.message || 'تم التعديل بنجاح'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-agents-continue:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
