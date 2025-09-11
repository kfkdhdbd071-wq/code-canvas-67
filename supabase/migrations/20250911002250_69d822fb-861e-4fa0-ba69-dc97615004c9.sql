-- إضافة جدول القوالب
CREATE TABLE public.templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'html', 'css', 'javascript', 'fullstack'
  thumbnail_url TEXT,
  html_code TEXT DEFAULT '<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>قالب جديد</title>
</head>
<body>
    <h1>مرحباً بالعالم!</h1>
</body>
</html>',
  css_code TEXT DEFAULT 'body {
    font-family: "Cairo", sans-serif;
    padding: 2rem;
    text-align: center;
}',
  js_code TEXT DEFAULT '// أضف الكود JavaScript هنا
console.log("مرحباً من القالب!");',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_featured BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0
);

-- إضافة الإعجابات للمشاريع
CREATE TABLE public.project_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- إضافة التعليقات للمشاريع
CREATE TABLE public.project_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إضافة حقل forked_from للمشاريع
ALTER TABLE public.projects ADD COLUMN forked_from UUID REFERENCES public.projects(id);
ALTER TABLE public.projects ADD COLUMN likes_count INTEGER DEFAULT 0;
ALTER TABLE public.projects ADD COLUMN comments_count INTEGER DEFAULT 0;

-- تفعيل RLS للجداول الجديدة
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_comments ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للقوالب
CREATE POLICY "Anyone can view templates" 
ON public.templates 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create templates" 
ON public.templates 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own templates" 
ON public.templates 
FOR UPDATE 
TO authenticated
USING (auth.uid() = created_by);

-- سياسات الأمان للإعجابات
CREATE POLICY "Anyone can view project likes" 
ON public.project_likes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can like projects" 
ON public.project_likes 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike projects" 
ON public.project_likes 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- سياسات الأمان للتعليقات
CREATE POLICY "Anyone can view comments" 
ON public.project_comments 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can add comments" 
ON public.project_comments 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" 
ON public.project_comments 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
ON public.project_comments 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- دوال لتحديث العدادات
CREATE OR REPLACE FUNCTION public.update_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.projects 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.project_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.projects 
    SET likes_count = likes_count - 1 
    WHERE id = OLD.project_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.projects 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.project_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.projects 
    SET comments_count = comments_count - 1 
    WHERE id = OLD.project_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- إنشاء التريجرز
CREATE TRIGGER update_likes_count_trigger
  AFTER INSERT OR DELETE ON public.project_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_likes_count();

CREATE TRIGGER update_comments_count_trigger
  AFTER INSERT OR DELETE ON public.project_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_comments_count();

-- إضافة بعض القوالب الأساسية
INSERT INTO public.templates (name, description, category, html_code, css_code, js_code, is_featured) VALUES
('صفحة هبوط بسيطة', 'قالب صفحة هبوط بتصميم جذاب', 'fullstack', 
'<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>صفحة الهبوط</title>
</head>
<body>
    <header>
        <nav>
            <div class="logo">شعاري</div>
            <ul>
                <li><a href="#home">الرئيسية</a></li>
                <li><a href="#about">نبذة</a></li>
                <li><a href="#contact">اتصل بنا</a></li>
            </ul>
        </nav>
    </header>
    <main>
        <section class="hero">
            <h1>مرحباً بك في موقعنا</h1>
            <p>نحن نقدم أفضل الخدمات لعملائنا الكرام</p>
            <button class="cta-button">ابدأ الآن</button>
        </section>
    </main>
</body>
</html>',
'* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: "Cairo", sans-serif;
    line-height: 1.6;
}

header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 1rem 0;
}

nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
}

.logo {
    font-size: 1.5rem;
    font-weight: bold;
}

nav ul {
    display: flex;
    list-style: none;
    gap: 2rem;
}

nav a {
    color: white;
    text-decoration: none;
    transition: opacity 0.3s;
}

nav a:hover {
    opacity: 0.8;
}

.hero {
    text-align: center;
    padding: 4rem 2rem;
    background: linear-gradient(45deg, #f093fb 0%, #f5576c 100%);
    color: white;
    min-height: 60vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.hero h1 {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.hero p {
    font-size: 1.2rem;
    margin-bottom: 2rem;
}

.cta-button {
    background: white;
    color: #333;
    border: none;
    padding: 1rem 2rem;
    font-size: 1.1rem;
    border-radius: 50px;
    cursor: pointer;
    transition: transform 0.3s;
}

.cta-button:hover {
    transform: translateY(-2px);
}',
'document.querySelector(".cta-button").addEventListener("click", function() {
    alert("مرحباً! تم النقر على الزر");
    this.textContent = "تم التفعيل!";
});

// تأثير التمرير السلس
document.querySelectorAll("nav a").forEach(link => {
    link.addEventListener("click", function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute("href"));
        if (target) {
            target.scrollIntoView({ behavior: "smooth" });
        }
    });
});', true),

('بطاقة شخصية', 'بطاقة تعريف شخصية أنيقة', 'fullstack',
'<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>بطاقة شخصية</title>
</head>
<body>
    <div class="card">
        <div class="card-header">
            <img src="https://via.placeholder.com/120" alt="الصورة الشخصية" class="avatar">
        </div>
        <div class="card-body">
            <h2>أحمد محمد</h2>
            <p class="title">مطور ويب</p>
            <p class="description">مطور ويب محترف متخصص في تطوير المواقع والتطبيقات</p>
            <div class="social-links">
                <a href="#" class="social-link">تويتر</a>
                <a href="#" class="social-link">لينكد إن</a>
                <a href="#" class="social-link">جيت هاب</a>
            </div>
            <button class="contact-btn">تواصل معي</button>
        </div>
    </div>
</body>
</html>',
'body {
    font-family: "Cairo", sans-serif;
    background: linear-gradient(135deg, #74b9ff, #0984e3);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0;
}

.card {
    background: white;
    border-radius: 20px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
    overflow: hidden;
    width: 350px;
    transition: transform 0.3s ease;
}

.card:hover {
    transform: translateY(-10px);
}

.card-header {
    background: linear-gradient(135deg, #667eea, #764ba2);
    padding: 2rem;
    text-align: center;
}

.avatar {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    border: 4px solid white;
    object-fit: cover;
}

.card-body {
    padding: 2rem;
    text-align: center;
}

.card-body h2 {
    margin: 0 0 0.5rem 0;
    color: #333;
    font-size: 1.5rem;
}

.title {
    color: #666;
    font-size: 1rem;
    margin: 0 0 1rem 0;
}

.description {
    color: #777;
    font-size: 0.9rem;
    line-height: 1.6;
    margin: 0 0 1.5rem 0;
}

.social-links {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
}

.social-link {
    color: #667eea;
    text-decoration: none;
    font-size: 0.9rem;
    transition: color 0.3s;
}

.social-link:hover {
    color: #764ba2;
}

.contact-btn {
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    border: none;
    padding: 0.8rem 2rem;
    border-radius: 25px;
    cursor: pointer;
    font-family: inherit;
    transition: transform 0.3s;
}

.contact-btn:hover {
    transform: translateY(-2px);
}',
'document.querySelector(".contact-btn").addEventListener("click", function() {
    alert("شكراً لتواصلك معي!");
});

// تأثير تفاعلي للروابط الاجتماعية
document.querySelectorAll(".social-link").forEach(link => {
    link.addEventListener("mouseenter", function() {
        this.style.transform = "scale(1.1)";
    });
    
    link.addEventListener("mouseleave", function() {
        this.style.transform = "scale(1)";
    });
});', true);

-- تريجر لتحديث updated_at للقوالب
CREATE TRIGGER update_templates_updated_at
BEFORE UPDATE ON public.templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();