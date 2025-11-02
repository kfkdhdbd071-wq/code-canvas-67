import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const identifier = url.pathname.split('/').pop();

    if (!identifier) {
      return new Response('Project identifier is required', { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    let query = supabase
      .from('projects')
      .select('*')
      .eq('is_published', true);

    // Check if identifier is a custom URL or project ID
    if (identifier.length === 36) {
      query = query.eq('id', identifier);
    } else {
      query = query.eq('custom_url', identifier);
    }

    const { data: project, error } = await query.single();

    if (error || !project) {
      return new Response(
        `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>المشروع غير موجود</title>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Cairo', sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: #f5f5f5;
        }
        .error-container {
            text-align: center;
            padding: 2rem;
        }
        h1 {
            font-size: 2rem;
            margin-bottom: 1rem;
            color: #333;
        }
        p {
            color: #666;
        }
    </style>
</head>
<body>
    <div class="error-container">
        <h1>المشروع غير موجود</h1>
        <p>لم يتم العثور على المشروع المطلوب أو أنه غير منشور</p>
    </div>
</body>
</html>`,
        {
          status: 404,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
          },
        }
      );
    }

    // Increment view count
    await supabase.rpc('increment_view_count', { project_uuid: project.id });

    // Construct full HTML
    const fullHTML = project.html_code
      .replace(
        '</head>',
        `<style>${project.css_code}</style>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&display=swap" rel="stylesheet">
</head>`
      )
      .replace(
        '</body>',
        `<script>${project.js_code}</script>
</body>`
      );

    return new Response(fullHTML, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error serving project:', error);
    return new Response(
      `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>خطأ</title>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&display=swap" rel="stylesheet">
</head>
<body style="font-family: 'Cairo', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0;">
    <div style="text-align: center; padding: 2rem;">
        <h1>حدث خطأ</h1>
        <p>عذراً، حدث خطأ أثناء تحميل المشروع</p>
    </div>
</body>
</html>`,
      {
        status: 500,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      }
    );
  }
});
