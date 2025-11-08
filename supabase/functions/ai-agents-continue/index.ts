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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, message, currentCode } = await req.json();
    
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Get current API key based on rotation
    let { key: GEMINI_API_KEY, index: currentKeyIndex } = await getCurrentApiKey(supabase);

    console.log('Processing modification request:', message);

    // Call Gemini API to modify the code based on user request
    let response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
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
          maxOutputTokens: 32768,
        }
      }),
    });

    // Handle 429 error by trying next API key
    if (response.status === 429) {
      console.log('Quota exceeded, trying next API key...');
      const nextKey = await tryNextApiKey(supabase, currentKeyIndex);
      GEMINI_API_KEY = nextKey.key;
      currentKeyIndex = nextKey.index;
      
      // Retry with new key
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
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
            maxOutputTokens: 32768,
          }
        }),
      });
    }

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
      console.error('Failed to parse JSON:', resultText.substring(0, 500) + '...');
      
      // Try to fix common JSON issues
      try {
        // Remove any trailing incomplete strings or objects
        let cleanedText = resultText;
        
        // Find the last complete closing brace
        let braceCount = 0;
        let lastValidIndex = -1;
        for (let i = 0; i < cleanedText.length; i++) {
          if (cleanedText[i] === '{') braceCount++;
          if (cleanedText[i] === '}') {
            braceCount--;
            if (braceCount === 0) {
              lastValidIndex = i + 1;
            }
          }
        }
        
        if (lastValidIndex > 0) {
          cleanedText = cleanedText.substring(0, lastValidIndex);
          result = JSON.parse(cleanedText);
          console.log('Successfully parsed cleaned JSON');
        } else {
          throw new Error('Could not find valid JSON structure');
        }
      } catch (cleanError) {
        console.error('Failed to clean and parse JSON:', cleanError);
        
        // Last resort: try regex extraction
        const jsonMatch = resultText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            result = JSON.parse(jsonMatch[0]);
          } catch {
            throw new Error('Could not parse AI response - JSON format invalid');
          }
        } else {
          throw new Error('Could not parse AI response - no JSON found');
        }
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
