import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GitFork } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface ProjectForkButtonProps {
  projectId: string;
  projectName: string;
  htmlCode: string;
  cssCode: string;
  jsCode: string;
}

const ProjectForkButton = ({ 
  projectId, 
  projectName, 
  htmlCode, 
  cssCode, 
  jsCode 
}: ProjectForkButtonProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleFork = async () => {
    if (!user) {
      toast({
        title: "تسجيل الدخول مطلوب",
        description: "يجب تسجيل الدخول لنسخ المشاريع",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    setLoading(true);

    try {
      // إنشاء نسخة جديدة من المشروع
      const { data: newProject, error } = await supabase
        .from('projects')
        .insert({
          project_name: `نسخة من ${projectName}`,
          html_code: htmlCode,
          css_code: cssCode,
          js_code: jsCode,
          user_id: user.id,
          forked_from: projectId,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "تم نسخ المشروع بنجاح",
        description: "تم إنشاء نسخة جديدة من المشروع في حسابك",
      });

      navigate(`/editor/${newProject.id}`);
    } catch (error: any) {
      toast({
        title: "خطأ في نسخ المشروع",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleFork}
      disabled={loading}
      className="flex items-center gap-2"
    >
      <GitFork className="h-4 w-4" />
      {loading ? "جاري النسخ..." : "نسخ"}
    </Button>
  );
};

export default ProjectForkButton;