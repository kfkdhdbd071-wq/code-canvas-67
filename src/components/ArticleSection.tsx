import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, ArrowLeft } from "lucide-react";
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
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
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
      .limit(6);

    if (!error && data) {
      setArticles(data);
    }
    setLoading(false);
  };

  const formatContent = (content: string) => {
    // تحويل Markdown البسيط إلى HTML
    return content
      .replace(/## (.*)/g, '<h2 class="text-xl font-bold mb-3 mt-6">$1</h2>')
      .replace(/### (.*)/g, '<h3 class="text-lg font-semibold mb-2 mt-4">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n\n/g, '</p><p class="mb-4">')
      .replace(/^(.*)$/gm, '<p class="mb-4">$1</p>');
  };

  if (selectedArticle) {
    return (
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Button 
              variant="ghost" 
              onClick={() => setSelectedArticle(null)}
              className="mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              العودة للمقالات
            </Button>
            
            <article className="bg-background rounded-lg shadow-sm border p-8">
              <header className="mb-6">
                <h1 className="text-3xl font-bold mb-4">{selectedArticle.title}</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {new Date(selectedArticle.created_at).toLocaleDateString('ar-EG')}
                  </div>
                  {selectedArticle.featured && (
                    <Badge variant="secondary">مقال مميز</Badge>
                  )}
                </div>
              </header>
              
              <div 
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ 
                  __html: formatContent(selectedArticle.content) 
                }}
              />
            </article>
          </div>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <BookOpen className="h-8 w-8 text-primary" />
            <h2 className="text-3xl font-bold">مقالات ونصائح</h2>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            اكتشف أحدث النصائح والتقنيات في عالم تطوير الويب
          </p>
        </div>

        {articles.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">لا توجد مقالات حالياً</h3>
            <p className="text-muted-foreground">سنقوم بإضافة مقالات جديدة قريباً</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Card 
                key={article.id} 
                className="group hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedArticle(article)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg leading-tight">{article.title}</CardTitle>
                    {article.featured && (
                      <Badge variant="secondary" className="ml-2">مميز</Badge>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-muted-foreground mb-4 line-clamp-3">
                    {article.excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {new Date(article.created_at).toLocaleDateString('ar-EG')}
                    </div>
                    <Button variant="ghost" size="sm">
                      اقرأ المزيد
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ArticleSection;