import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Code, Eye, Heart, MessageCircle, GitFork, Search, Clock, TrendingUp, Users, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ProjectLikeButton from "@/components/ProjectLikeButton";
import ProjectForkButton from "@/components/ProjectForkButton";

interface CommunityProject {
  id: string;
  project_name: string;
  html_code: string;
  css_code: string;
  js_code: string;
  created_at: string;
  view_count: number;
  likes_count: number;
  comments_count: number;
  user_id: string;
}

const Community = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [projects, setProjects] = useState<CommunityProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchCommunityProjects();
  }, []);

  const fetchCommunityProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        id,
        project_name,
        html_code,
        css_code,
        js_code,
        view_count,
        likes_count,
        comments_count,
        created_at,
        user_id
      `)
      .eq('show_in_community', true)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      toast({
        title: "خطأ في تحميل المشاريع",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setProjects(data || []);
    }
    setLoading(false);
  };

  const viewProject = async (projectId: string) => {
    // زيادة عدد المشاهدات
    await supabase.rpc('increment_view_count', { project_uuid: projectId });
    
    // الانتقال لصفحة المشروع
    navigate(`/p/${projectId}`);
  };

  const generatePreview = (project: CommunityProject) => {
    return project.html_code.replace(
      '</head>',
      `<style>${project.css_code}</style>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&display=swap" rel="stylesheet">
</head>`
    ).replace(
      '</body>',
      `<script>${project.js_code}</script>
</body>`
    );
  };

  const filteredProjects = projects.filter(project =>
    project.project_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/')}>
                <Home className="h-4 w-4 mr-2" />
                الرئيسية
              </Button>
              <div className="flex items-center gap-2">
                <Code className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">كودر - المجتمع</span>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              لوحة التحكم
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* شريط البحث */}
        <div className="mb-8">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="ابحث في مشاريع المجتمع..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* إحصائيات */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Code className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{projects.length}</p>
                <p className="text-sm text-muted-foreground">مشروع في المجتمع</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {projects.reduce((sum, p) => sum + p.view_count, 0)}
                </p>
                <p className="text-sm text-muted-foreground">إجمالي المشاهدات</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-2 bg-red-100 rounded-lg">
                <Heart className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {projects.reduce((sum, p) => sum + p.likes_count, 0)}
                </p>
                <p className="text-sm text-muted-foreground">إجمالي الإعجابات</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* المشاريع */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">لا توجد مشاريع</h3>
            <p className="text-muted-foreground">
              {searchTerm ? "لا توجد مشاريع تطابق البحث" : "لا توجد مشاريع في المجتمع حاليًا"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Card key={project.id} className="group hover:shadow-lg transition-shadow overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{project.project_name}</CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>بواسطة مطور</span>
                  </div>
                </CardHeader>
                
                <CardContent className="p-0">
                  {/* معاينة */}
                  <div className="h-48 border-b overflow-hidden bg-gray-50">
                    <iframe
                      srcDoc={generatePreview(project)}
                      className="w-full h-full border-0 pointer-events-none scale-75 origin-top-left"
                      title={`معاينة ${project.project_name}`}
                      sandbox="allow-scripts"
                      style={{ width: '133.33%', height: '133.33%' }}
                    />
                  </div>
                  
                  {/* الإجراءات */}
                  <div className="p-4">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {project.view_count}
                          </div>
                          <div className="flex items-center gap-1">
                            <Heart className="h-4 w-4" />
                            {project.likes_count}
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4" />
                            {project.comments_count}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <Clock className="h-3 w-3" />
                          {new Date(project.created_at).toLocaleDateString('ar-EG')}
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <ProjectLikeButton 
                          projectId={project.id} 
                          initialLikesCount={project.likes_count}
                        />
                        <ProjectForkButton
                          projectId={project.id}
                          projectName={project.project_name}
                          htmlCode={project.html_code}
                          cssCode={project.css_code}
                          jsCode={project.js_code}
                        />
                        <Button size="sm" onClick={() => viewProject(project.id)}>
                          <Eye className="h-4 w-4 mr-2" />
                          عرض
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Community;