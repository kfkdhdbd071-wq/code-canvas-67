import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Code, LogOut, Edit, Trash2, ExternalLink, Calendar, Users, BookOpen, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ArticleManager from "@/components/ArticleManager";

interface Project {
  id: string;
  project_name: string;
  custom_url: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

interface Profile {
  display_name: string | null;
  avatar_url: string | null;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectUrl, setNewProjectUrl] = useState("");

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchProjects();
    }
  }, [user]);

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('user_id', user?.id)
      .single();

    if (!error && data) {
      setProfile(data);
    }
  };

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user?.id)
      .order('updated_at', { ascending: false });

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

  const createProject = async () => {
    if (!newProjectName.trim()) {
      toast({
        title: "اسم المشروع مطلوب",
        description: "يرجى إدخال اسم للمشروع",
        variant: "destructive",
      });
      return;
    }

    const customUrl = newProjectUrl.trim() || null;
    
    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: user?.id,
        project_name: newProjectName.trim(),
        custom_url: customUrl,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        toast({
          title: "الرابط المخصص مستخدم",
          description: "هذا الرابط مستخدم بالفعل، اختر رابطاً آخر",
          variant: "destructive",
        });
      } else {
        toast({
          title: "خطأ في إنشاء المشروع",
          description: error.message,
          variant: "destructive",
        });
      }
    } else {
      setProjects([data, ...projects]);
      setIsCreateDialogOpen(false);
      setNewProjectName("");
      setNewProjectUrl("");
      toast({
        title: "تم إنشاء المشروع",
        description: "تم إنشاء مشروعك بنجاح",
      });
    }
  };

  const deleteProject = async (projectId: string) => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      toast({
        title: "خطأ في حذف المشروع",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setProjects(projects.filter(p => p.id !== projectId));
      toast({
        title: "تم حذف المشروع",
        description: "تم حذف المشروع بنجاح",
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
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
              <div className="flex items-center gap-2">
                <Code className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">كودر</span>
              </div>
              <Button 
                variant="ghost" 
                onClick={() => navigate('/templates')}
                className="flex items-center gap-2"
              >
                <BookOpen className="h-4 w-4" />
                القوالب
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => navigate('/community')}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                المجتمع
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback>
                  {profile?.display_name?.charAt(0) || user?.email?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">
                {profile?.display_name || user?.email}
              </span>
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="projects" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              مشاريعي
            </TabsTrigger>
            <TabsTrigger value="articles" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              المقالات
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="mt-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold">مشاريعي</h1>
                <p className="text-muted-foreground">إدارة وإنشاء مشاريع الويب الخاصة بك</p>
              </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                مشروع جديد
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إنشاء مشروع جديد</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="projectName">اسم المشروع</Label>
                  <Input
                    id="projectName"
                    placeholder="اسم المشروع"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customUrl">الرابط المخصص (اختياري)</Label>
                  <Input
                    id="customUrl"
                    placeholder="my-awesome-project"
                    value={newProjectUrl}
                    onChange={(e) => setNewProjectUrl(e.target.value)}
                  />
                </div>
                <Button onClick={createProject} className="w-full">
                  إنشاء المشروع
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-start justify-between">
                  <span className="text-lg">{project.project_name}</span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/editor/${project.id}`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {project.is_published && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(`/p/${project.custom_url || project.id}`, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteProject(project.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {project.custom_url && (
                    <p className="text-sm text-muted-foreground">
                      الرابط: {project.custom_url}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {new Date(project.updated_at).toLocaleDateString('ar-EG')}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => navigate(`/editor/${project.id}`)}
                      className="flex-1"
                    >
                      تحرير
                    </Button>
                    {project.is_published ? (
                      <span className="px-3 py-2 bg-green-100 text-green-800 rounded text-sm">
                        منشور
                      </span>
                    ) : (
                      <span className="px-3 py-2 bg-gray-100 text-gray-800 rounded text-sm">
                        مسودة
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

            {projects.length === 0 && (
              <div className="text-center py-12">
                <Code className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">لا توجد مشاريع بعد</h3>
                <p className="text-muted-foreground mb-4">ابدأ بإنشاء مشروعك الأول</p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  إنشاء مشروع جديد
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="articles" className="mt-8">
            <ArticleManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;