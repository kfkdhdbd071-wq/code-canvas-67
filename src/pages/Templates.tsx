import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Eye, Search, Star, TrendingUp, Layout, Palette, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail_url?: string;
  html_code: string;
  css_code: string;
  js_code: string;
  is_featured: boolean;
  usage_count: number;
  created_at: string;
}

const Templates = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .order('is_featured', { ascending: false })
      .order('usage_count', { ascending: false });

    if (error) {
      toast({
        title: "خطأ في تحميل القوالب",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setTemplates(data || []);
    }
    setLoading(false);
  };

  const handleUseTemplate = async (template: Template) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      // إنشاء مشروع جديد من القالب
      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          project_name: `${template.name} - نسختي`,
          html_code: template.html_code,
          css_code: template.css_code,
          js_code: template.js_code,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // تحديث عدد الاستخدامات
      await supabase
        .from('templates')
        .update({ usage_count: template.usage_count + 1 })
        .eq('id', template.id);

      toast({
        title: "تم إنشاء المشروع",
        description: "تم إنشاء مشروع جديد من القالب بنجاح",
      });

      navigate(`/editor/${project.id}`);
    } catch (error: any) {
      toast({
        title: "خطأ في إنشاء المشروع",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'html': return <Layout className="h-4 w-4" />;
      case 'css': return <Palette className="h-4 w-4" />;
      case 'javascript': return <Zap className="h-4 w-4" />;
      case 'fullstack': return <Code className="h-4 w-4" />;
      default: return <Code className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'html': return 'bg-orange-100 text-orange-800';
      case 'css': return 'bg-blue-100 text-blue-800';
      case 'javascript': return 'bg-yellow-100 text-yellow-800';
      case 'fullstack': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Code className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold">كودر - القوالب</span>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              العودة للوحة التحكم
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* شريط البحث والفلترة */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="ابحث في القوالب..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">الكل</TabsTrigger>
              <TabsTrigger value="html">HTML</TabsTrigger>
              <TabsTrigger value="css">CSS</TabsTrigger>
              <TabsTrigger value="javascript">JavaScript</TabsTrigger>
              <TabsTrigger value="fullstack">متكامل</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* القوالب المميزة */}
        {templates.filter(t => t.is_featured).length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Star className="h-6 w-6 text-yellow-500" />
              القوالب المميزة
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.filter(t => t.is_featured).map((template) => (
                <Card key={template.id} className="group hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <Badge className={getCategoryColor(template.category)} variant="secondary">
                        <div className="flex items-center gap-1">
                          {getCategoryIcon(template.category)}
                          {template.category}
                        </div>
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          {template.usage_count} استخدام
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          معاينة
                        </Button>
                        <Button size="sm" onClick={() => handleUseTemplate(template)}>
                          <Code className="h-4 w-4 mr-2" />
                          استخدم
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* جميع القوالب */}
        <div>
          <h2 className="text-2xl font-bold mb-4">جميع القوالب</h2>
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <Code className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">لا توجد قوالب متاحة</h3>
              <p className="text-muted-foreground">جرب تغيير كلمات البحث أو الفئة</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => (
                <Card key={template.id} className="group hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <Badge className={getCategoryColor(template.category)} variant="secondary">
                        <div className="flex items-center gap-1">
                          {getCategoryIcon(template.category)}
                          {template.category}
                        </div>
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          {template.usage_count} استخدام
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          معاينة
                        </Button>
                        <Button size="sm" onClick={() => handleUseTemplate(template)}>
                          <Code className="h-4 w-4 mr-2" />
                          استخدم
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Templates;