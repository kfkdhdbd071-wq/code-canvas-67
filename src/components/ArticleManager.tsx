import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Eye, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Article {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  published: boolean;
  featured: boolean;
  created_at: string;
}

const ArticleManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [articles, setArticles] = useState<Article[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentArticle, setCurrentArticle] = useState<Partial<Article>>({
    title: '',
    content: '',
    excerpt: '',
    slug: '',
    published: false,
    featured: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchArticles();
    }
  }, [user]);

  const fetchArticles = async () => {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('author_id', user?.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "خطأ في تحميل المقالات",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setArticles(data || []);
    }
    setLoading(false);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  };

  const handleSave = async () => {
    if (!currentArticle.title || !currentArticle.content) {
      toast({
        title: "خطأ",
        description: "يرجى ملء العنوان والمحتوى",
        variant: "destructive",
      });
      return;
    }

    const articleData = {
      title: currentArticle.title!,
      content: currentArticle.content!,
      excerpt: currentArticle.excerpt || '',
      slug: currentArticle.slug || generateSlug(currentArticle.title!),
      published: currentArticle.published || false,
      featured: currentArticle.featured || false,
      author_id: user?.id!,
    };

    try {
      if (currentArticle.id) {
        // تحديث مقال موجود
        const { error } = await supabase
          .from('articles')
          .update(articleData)
          .eq('id', currentArticle.id);

        if (error) throw error;
        
        toast({
          title: "تم تحديث المقال بنجاح",
        });
      } else {
        // إنشاء مقال جديد
        const { error } = await supabase
          .from('articles')
          .insert(articleData);

        if (error) throw error;
        
        toast({
          title: "تم إنشاء المقال بنجاح",
        });
      }

      setIsEditing(false);
      setCurrentArticle({
        title: '',
        content: '',
        excerpt: '',
        slug: '',
        published: false,
        featured: false,
      });
      fetchArticles();
    } catch (error: any) {
      toast({
        title: "خطأ في حفظ المقال",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (article: Article) => {
    setCurrentArticle(article);
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المقال؟')) return;

    try {
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "تم حذف المقال بنجاح",
      });
      fetchArticles();
    } catch (error: any) {
      toast({
        title: "خطأ في حذف المقال",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setCurrentArticle({
      title: '',
      content: '',
      excerpt: '',
      slug: '',
      published: false,
      featured: false,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">إدارة المقالات</h2>
        <Button onClick={() => setIsEditing(true)}>
          <Plus className="h-4 w-4 mr-2" />
          مقال جديد
        </Button>
      </div>

      {isEditing && (
        <Card>
          <CardHeader>
            <CardTitle>
              {currentArticle.id ? 'تحرير المقال' : 'مقال جديد'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">العنوان</Label>
              <Input
                id="title"
                value={currentArticle.title}
                onChange={(e) => setCurrentArticle({
                  ...currentArticle,
                  title: e.target.value,
                  slug: generateSlug(e.target.value)
                })}
                placeholder="عنوان المقال"
              />
            </div>

            <div>
              <Label htmlFor="excerpt">المقدمة</Label>
              <Textarea
                id="excerpt"
                value={currentArticle.excerpt}
                onChange={(e) => setCurrentArticle({
                  ...currentArticle,
                  excerpt: e.target.value
                })}
                placeholder="مقدمة المقال (اختيارية)"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="content">المحتوى</Label>
              <Textarea
                id="content"
                value={currentArticle.content}
                onChange={(e) => setCurrentArticle({
                  ...currentArticle,
                  content: e.target.value
                })}
                placeholder="محتوى المقال"
                rows={15}
              />
            </div>

            <div>
              <Label htmlFor="slug">الرابط المختصر</Label>
              <Input
                id="slug"
                value={currentArticle.slug}
                onChange={(e) => setCurrentArticle({
                  ...currentArticle,
                  slug: e.target.value
                })}
                placeholder="الرابط المختصر"
              />
            </div>

            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Switch
                  id="published"
                  checked={currentArticle.published}
                  onCheckedChange={(checked) => setCurrentArticle({
                    ...currentArticle,
                    published: checked
                  })}
                />
                <Label htmlFor="published">منشور</Label>
              </div>

              <div className="flex items-center space-x-2 space-x-reverse">
                <Switch
                  id="featured"
                  checked={currentArticle.featured}
                  onCheckedChange={(checked) => setCurrentArticle({
                    ...currentArticle,
                    featured: checked
                  })}
                />
                <Label htmlFor="featured">مميز</Label>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                حفظ
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                إلغاء
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {articles.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">لا توجد مقالات حتى الآن</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {articles.map((article) => (
            <Card key={article.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{article.title}</h3>
                      {article.published && (
                        <Badge variant="secondary">منشور</Badge>
                      )}
                      {article.featured && (
                        <Badge variant="default">مميز</Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground mb-2 line-clamp-2">
                      {article.excerpt}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      تم الإنشاء: {new Date(article.created_at).toLocaleDateString('ar-EG')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(article)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleDelete(article.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ArticleManager;