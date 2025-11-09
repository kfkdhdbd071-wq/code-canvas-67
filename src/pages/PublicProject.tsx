import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Code, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PublicProject = () => {
  const { identifier } = useParams();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(true);

  useEffect(() => {
    if (identifier) {
      fetchProject();
    }
  }, [identifier]);

  const fetchProject = async () => {
    // Check if URL contains a subpage route (e.g., /p/main-id/article-1)
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const subpageRoute = pathParts.length > 2 ? '/' + pathParts.slice(2).join('/') : null;

    let query = supabase
      .from('projects')
      .select('*')
      .eq('is_published', true);

    // If we have a subpage route, look for it
    if (subpageRoute) {
      const parentIdentifier = pathParts[1];
      
      // First get parent project ID
      let parentQuery = supabase
        .from('projects')
        .select('id')
        .eq('is_published', true);
      
      if (parentIdentifier.length === 36) {
        parentQuery = parentQuery.eq('id', parentIdentifier);
      } else {
        parentQuery = parentQuery.eq('custom_url', parentIdentifier);
      }
      
      const { data: parentData } = await parentQuery.single();
      
      if (parentData) {
        // Now look for subpage
        query = query
          .eq('parent_project_id', parentData.id)
          .eq('subpage_route', subpageRoute)
          .eq('is_subpage', true);
      }
    } else {
      // Regular project lookup
      if (identifier!.length === 36) {
        query = query.eq('id', identifier);
      } else {
        query = query.eq('custom_url', identifier);
      }
      
      // Make sure we're not getting a subpage
      query = query.eq('is_subpage', false);
    }

    const { data, error } = await query.single();

    if (error || !data) {
      setNotFound(true);
    } else {
      setProject(data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Code className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">المشروع غير موجود</h1>
          <p className="text-muted-foreground">
            لم يتم العثور على المشروع المطلوب أو أنه غير منشور
          </p>
        </div>
      </div>
    );
  }

  const fullHTML = project.html_code
    .replace(
      '</head>',
      `<style>${project.css_code}</style>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&display=swap" rel="stylesheet">
</head>`
    )
    .replace(
      '</body>',
      `<script>${project.js_code}</script>
</body>`
    );

  return (
    <>
      <iframe
        srcDoc={fullHTML}
        className="w-full h-screen border-0"
        title={project.project_name}
        sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
      />

      <a
        href="https://lumix-reseash.lovable.app/"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed right-4 top-6 z-50 bg-primary text-primary-foreground px-3 py-1.5 rounded-full shadow-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring transition"
        aria-label="Made with Lumix"
      >
        make with lumix
      </a>

      {/* Welcome Dialog */}
      <Dialog open={showWelcomeDialog} onOpenChange={setShowWelcomeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              مستضاف على Lumix Cloud
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowWelcomeDialog(false)}
                className="h-6 w-6"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
            <DialogDescription className="text-base pt-2 space-y-2">
              <p>
                هذا الموقع مستضاف على خدمة <strong>Lumix Cloud</strong>
              </p>
              <p>
                منصة لعمل الأبحاث عن طريق الذكاء الاصطناعي
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowWelcomeDialog(false)}
              className="w-full sm:w-auto"
            >
              إغلاق
            </Button>
            <Button
              variant="default"
              onClick={() => {
                window.open('https://lumix-reseash.lovable.app/', '_blank');
                setShowWelcomeDialog(false);
              }}
              className="w-full sm:w-auto"
            >
              زيارة الآن
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PublicProject;