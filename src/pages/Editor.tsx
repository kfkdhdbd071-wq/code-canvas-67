import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Play, Save, Share, Home, Settings, Download, Users, Globe } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import CodeEditor from "@/components/CodeEditor";
import JSZip from "jszip";

const Editor = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCommunityToggle, setShowCommunityToggle] = useState(false);
  
  const [htmlCode, setHtmlCode] = useState(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>مشروعي الجديد</title>
</head>
<body>
    <h1>مرحباً بالعالم!</h1>
    <p>هذا أول موقع لي باستخدام كودر</p>
</body>
</html>`);

  const [cssCode, setCssCode] = useState(`body {
    font-family: 'Cairo', sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 2rem;
    text-align: center;
}

h1 {
    font-size: 3rem;
    margin-bottom: 1rem;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

p {
    font-size: 1.2rem;
    opacity: 0.9;
}`);

  const [jsCode, setJsCode] = useState(`// أضف الكود JavaScript هنا
console.log('مرحباً من كودر!');

// مثال: تغيير لون الخلفية عند النقر
document.addEventListener('click', function() {
    document.body.style.background = 
        'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)';
});`);

  const [previewContent, setPreviewContent] = useState("");

  useEffect(() => {
    if (projectId && user) {
      fetchProject();
    }
  }, [projectId, user]);

  useEffect(() => {
    const generatePreview = () => {
      const fullHTML = htmlCode.replace(
        '</head>',
        `<style>${cssCode}</style>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&display=swap" rel="stylesheet">
</head>`
      ).replace(
        '</body>',
        `<script>${jsCode}</script>
</body>`
      );
      setPreviewContent(fullHTML);
    };

    const timer = setTimeout(generatePreview, 500);
    return () => clearTimeout(timer);
  }, [htmlCode, cssCode, jsCode]);

  const fetchProject = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user?.id)
      .single();

    if (error) {
      toast({
        title: "خطأ في تحميل المشروع",
        description: error.message,
        variant: "destructive",
      });
      navigate('/dashboard');
    } else {
      setProject(data);
      setHtmlCode(data.html_code);
      setCssCode(data.css_code);
      setJsCode(data.js_code);
      setShowCommunityToggle(data.show_in_community || false);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!project) return;

    const { error } = await supabase
      .from('projects')
      .update({
        html_code: htmlCode,
        css_code: cssCode,
        js_code: jsCode,
        updated_at: new Date().toISOString(),
      })
      .eq('id', project.id);

    if (error) {
      toast({
        title: "خطأ في الحفظ",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "تم الحفظ بنجاح",
        description: "تم حفظ مشروعك في السحابة",
      });
    }
  };

  const handlePublish = async () => {
    if (!project) return;

    const { error } = await supabase
      .from('projects')
      .update({
        html_code: htmlCode,
        css_code: cssCode,
        js_code: jsCode,
        is_published: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', project.id);

    if (error) {
      toast({
        title: "خطأ في النشر",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setProject({ ...project, is_published: true });
      const url = project.custom_url 
        ? `${window.location.origin}/p/${project.custom_url}`
        : `${window.location.origin}/p/${project.id}`;
      
      navigator.clipboard.writeText(url);
      toast({
        title: "تم النشر بنجاح",
        description: "تم نسخ رابط المشروع إلى الحافظة",
      });
    }
  };

  const handleCommunityToggle = async () => {
    if (!project) return;

    const newValue = !showCommunityToggle;
    const { error } = await supabase
      .from('projects')
      .update({ show_in_community: newValue })
      .eq('id', project.id);

    if (error) {
      toast({
        title: "خطأ في التحديث",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setShowCommunityToggle(newValue);
      toast({
        title: newValue ? "تم إضافة المشروع للمجتمع" : "تم إزالة المشروع من المجتمع",
        description: newValue ? "يمكن للآخرين الآن رؤية مشروعك" : "لن يظهر مشروعك في المجتمع",
      });
    }
  };

  const generateCollaborationLink = async () => {
    if (!project) return;

    // Generate a unique collaboration token
    const token = `collab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const { error } = await supabase
      .from('projects')
      .update({ collaboration_token: token })
      .eq('id', project.id);

    if (error) {
      toast({
        title: "خطأ في إنشاء رابط التعاون",
        description: error.message,
        variant: "destructive",
      });
    } else {
      const collabUrl = `${window.location.origin}/editor/${project.id}?token=${token}`;
      navigator.clipboard.writeText(collabUrl);
      setProject({ ...project, collaboration_token: token });
      toast({
        title: "تم إنشاء رابط التعاون",
        description: "تم نسخ الرابط إلى الحافظة - شاركه مع من تريد التعاون معه",
      });
    }
  };

  const handleDownload = async () => {
    const zip = new JSZip();
    
    // Add files to zip
    zip.file("index.html", htmlCode);
    zip.file("style.css", cssCode);
    zip.file("script.js", jsCode);
    
    // Generate zip file
    const content = await zip.generateAsync({ type: "blob" });
    
    // Create download link
    const url = window.URL.createObjectURL(content);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${project?.project_name || "project"}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "تم التحميل بنجاح",
      description: "تم تحميل ملفات المشروع كـ ZIP",
    });
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
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/dashboard')}
              >
                <Home className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <Code className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">كودر</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {project?.project_name || "تحميل..."}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                حفظ
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                تحميل
              </Button>
              <Button variant="default" size="sm" onClick={handlePublish}>
                <Share className="h-4 w-4 mr-2" />
                {project?.is_published ? "تحديث النشر" : "نشر"}
              </Button>
              <Button 
                variant={showCommunityToggle ? "default" : "outline"} 
                size="sm" 
                onClick={handleCommunityToggle}
              >
                <Users className="h-4 w-4 mr-2" />
                {showCommunityToggle ? "في المجتمع" : "إضافة للمجتمع"}
              </Button>
              <Button variant="outline" size="sm" onClick={generateCollaborationLink}>
                <Globe className="h-4 w-4 mr-2" />
                رابط التعاون
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Code Editor */}
        <div className="w-1/2 border-r">
          <Tabs defaultValue="html" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3 rounded-none">
              <TabsTrigger value="html" className="text-sm">HTML</TabsTrigger>
              <TabsTrigger value="css" className="text-sm">CSS</TabsTrigger>
              <TabsTrigger value="js" className="text-sm">JavaScript</TabsTrigger>
            </TabsList>
            
            <TabsContent value="html" className="flex-1 m-0">
              <CodeEditor
                value={htmlCode}
                onChange={setHtmlCode}
                language="html"
                placeholder="أكتب كود HTML هنا..."
              />
            </TabsContent>
            
            <TabsContent value="css" className="flex-1 m-0">
              <CodeEditor
                value={cssCode}
                onChange={setCssCode}
                language="css"
                placeholder="أكتب كود CSS هنا..."
              />
            </TabsContent>
            
            <TabsContent value="js" className="flex-1 m-0">
              <CodeEditor
                value={jsCode}
                onChange={setJsCode}
                language="javascript"
                placeholder="أكتب كود JavaScript هنا..."
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview */}
        <div className="w-1/2 flex flex-col">
          <div className="bg-card border-b px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Play className="h-5 w-5 text-primary" />
              <span className="font-medium">المعاينة المباشرة</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-3 h-3 bg-destructive rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </div>
          
          <iframe
            srcDoc={previewContent}
            className="flex-1 w-full border-0"
            title="معاينة المشروع"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>
    </div>
  );
};

export default Editor;