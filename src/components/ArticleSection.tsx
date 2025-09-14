import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Article {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  featured: boolean;
  created_at: string;
}

const ArticleSection = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(3);

    if (!error && data) {
      setArticles(data);
    }
    setLoading(false);
  };

  const formatContent = (content: string) => {
    // تحويل Markdown البسيط إلى HTML
    return content
      .replace(/## (.*)/g, '<h2 class="text-2xl font-bold mb-4 mt-8 text-white">$1</h2>')
      .replace(/### (.*)/g, '<h3 class="text-xl font-semibold mb-3 mt-6 text-white/90">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
      .replace(/\n\n/g, '</p><p class="mb-4 text-white/80 leading-relaxed">')
      .replace(/^(.*)$/gm, '<p class="mb-4 text-white/80 leading-relaxed">$1</p>');
  };

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-b from-primary/5 to-transparent">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <BookOpen className="h-10 w-10 text-accent" />
            <h2 className="text-4xl font-bold text-white">مقالات ونصائح تطوير الويب</h2>
          </div>
          <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
            اكتشف أحدث النصائح والتقنيات في عالم تطوير الويب باستخدام HTML وCSS وJavaScript من خلال منصة كودر العربية
          </p>
        </div>

        {articles.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="h-20 w-20 text-white/40 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-white mb-4">لا توجد مقالات حالياً</h3>
            <p className="text-white/60 text-lg">سنقوم بإضافة مقالات جديدة عن تطوير مواقع الويب قريباً</p>
          </div>
        ) : (
          <div className="space-y-12">
            {articles.map((article, index) => (
              <article 
                key={article.id} 
                className="max-w-6xl mx-auto"
              >
                <Card className="bg-white/10 border-white/20 backdrop-blur-lg overflow-hidden">
                  <CardHeader className="pb-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-3xl font-bold text-white leading-tight">{article.title}</h3>
                      {article.featured && (
                        <Badge variant="secondary" className="bg-accent/20 text-accent border-accent/30">
                          مقال مميز
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-white/60">
                      <Clock className="h-5 w-5" />
                      <time dateTime={article.created_at}>
                        {new Date(article.created_at).toLocaleDateString('ar-EG', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </time>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div 
                      className="prose prose-lg max-w-none"
                      dangerouslySetInnerHTML={{ 
                        __html: formatContent(article.content) 
                      }}
                    />
                  </CardContent>
                </Card>
                
                {index < articles.length - 1 && (
                  <div className="flex justify-center mt-12">
                    <div className="w-20 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ArticleSection;