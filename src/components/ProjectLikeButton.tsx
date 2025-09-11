import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ProjectLikeButtonProps {
  projectId: string;
  initialLikesCount?: number;
  onLikeChange?: (newCount: number) => void;
}

const ProjectLikeButton = ({ projectId, initialLikesCount = 0, onLikeChange }: ProjectLikeButtonProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      checkIfLiked();
    }
  }, [user, projectId]);

  const checkIfLiked = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('project_likes')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .single();

    setIsLiked(!!data);
  };

  const handleLike = async () => {
    if (!user) {
      toast({
        title: "تسجيل الدخول مطلوب",
        description: "يجب تسجيل الدخول للإعجاب بالمشاريع",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (isLiked) {
        // إلغاء الإعجاب
        const { error } = await supabase
          .from('project_likes')
          .delete()
          .eq('project_id', projectId)
          .eq('user_id', user.id);

        if (error) throw error;

        setIsLiked(false);
        const newCount = likesCount - 1;
        setLikesCount(newCount);
        onLikeChange?.(newCount);
      } else {
        // إضافة إعجاب
        const { error } = await supabase
          .from('project_likes')
          .insert({
            project_id: projectId,
            user_id: user.id,
          });

        if (error) throw error;

        setIsLiked(true);
        const newCount = likesCount + 1;
        setLikesCount(newCount);
        onLikeChange?.(newCount);
      }
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={isLiked ? "default" : "outline"}
      size="sm"
      onClick={handleLike}
      disabled={loading}
      className="flex items-center gap-2"
    >
      <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
      {likesCount}
    </Button>
  );
};

export default ProjectLikeButton;