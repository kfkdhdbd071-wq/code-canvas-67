import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Play, Calendar, User, Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface CommunityProject {
  id: string;
  project_name: string;
  html_code: string;
  css_code: string;
  js_code: string;
  view_count: number;
  created_at: string;
  profiles: {
    display_name: string;
    avatar_url: string;
  };
}

const Community = () => {
  const [projects, setProjects] = useState<CommunityProject[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

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
        created_at,
        user_id
      `)
      .eq('show_in_community', true)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      toast({
        title: "خطأ في تحميل المشاريع",
        description: error.message,
        variant: "destructive",
      });
    } else {
      // Fetch profiles for each project
      const projectsWithProfiles = await Promise.all(
        (data || []).map(async (project) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('user_id', project.user_id)
            .single();

          return {
            ...project,
            profiles: profileData || { display_name: "مستخدم", avatar_url: "" }
          };
        })
      );
      setProjects(projectsWithProfiles);
    }
    setLoading(false);
  };

  const handleViewProject = async (project: CommunityProject) => {
    // Increment view count
    await supabase.rpc('increment_view_count', { project_uuid: project.id });
    
    // Navigate to public project page
    navigate(`/p/${project.id}`);
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
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/dashboard')}
              >
                <Home className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold">مجتمع كودر</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Projects Grid */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{project.project_name}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>{project.profiles?.display_name || "مستخدم"}</span>
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{new Date(project.created_at).toLocaleDateString('ar-EG')}</span>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                {/* Preview */}
                <div className="h-48 border-b overflow-hidden">
                  <iframe
                    srcDoc={generatePreview(project)}
                    className="w-full h-full border-0 pointer-events-none"
                    title={`معاينة ${project.project_name}`}
                    sandbox="allow-scripts"
                  />
                </div>
                
                {/* Actions */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {project.view_count}
                    </Badge>
                  </div>
                  
                  <Button 
                    size="sm" 
                    onClick={() => handleViewProject(project)}
                    className="flex items-center gap-2"
                  >
                    <Play className="h-4 w-4" />
                    مشاهدة
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {projects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              لا توجد مشاريع في المجتمع حاليًا
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Community;