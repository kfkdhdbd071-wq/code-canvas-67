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
  // Helpers: UUID validation and path normalization
  const isValidUuid = (value: string) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(value);
  const normalizeRouteCandidates = (route: string | null) => {
    if (!route) return [] as string[];
    const decoded = decodeURIComponent(route);
    const withSlash = decoded.startsWith('/') ? decoded : `/${decoded}`;
    const withoutSlash = withSlash.replace(/^\/+/, '');
    return Array.from(new Set([withSlash, withoutSlash]));
  };

  useEffect(() => {
    if (identifier) {
      fetchProject();
    }
  }, [identifier]);

  const fetchProject = async () => {
    // Check if URL contains a subpage route (e.g., /p/main-id/article-1)
    const pathParts = window.location.pathname
      .split('/')
      .filter(Boolean)
      .map((p) => decodeURIComponent(p));
    const subpageRoute = pathParts.length > 2 ? '/' + pathParts.slice(2).join('/') : null;
    const subpageCandidates = normalizeRouteCandidates(subpageRoute);

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
      
      if (isValidUuid(parentIdentifier)) {
        parentQuery = parentQuery.eq('id', parentIdentifier);
      } else {
        parentQuery = parentQuery.eq('custom_url', parentIdentifier);
      }
      
      const { data: parentData } = await parentQuery.single();
      
      if (parentData) {
        const routes = subpageCandidates.length ? subpageCandidates : [subpageRoute!];
        query = query
          .eq('parent_project_id', parentData.id)
          .in('subpage_route', routes)
          .eq('is_subpage', true);
      }
    } else {
      if (isValidUuid(identifier!)) {
        query = query.eq('id', identifier);
      } else {
        query = query.eq('custom_url', decodeURIComponent(identifier!));
      }
      
      // Make sure we're not getting a subpage
      query = query.eq('is_subpage', false);
    }

    const { data, error } = await query.single();

    if ((error || !data) && !subpageRoute && identifier) {
      // Fallback: إذا زار المستخدم /p/article1.html مباشرةً
      const candidates = normalizeRouteCandidates(identifier);
      const { data: subData } = await supabase
        .from('projects')
        .select('*')
        .eq('is_published', true)
        .eq('is_subpage', true)
        .in('subpage_route', candidates)
        .single();

      if (subData) {
        setProject(subData);
        setLoading(false);
        return;
      }
    }

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

  const projectIdentifierForBase = project.custom_url ?? project.id;
  const absoluteBase = `${window.location.origin}/p/${encodeURIComponent(projectIdentifierForBase)}/`;

  const fullHTML = project.html_code
    .replace(
      '</head>',
      `<base href="${absoluteBase}" target="_top">
<style>${project.css_code}</style>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&display=swap" rel="stylesheet">
</head>`
    )
    .replace(
      '</body>',
      `<script>${project.js_code}</script>
<script>(function(){
  try {
    var BASE = '${absoluteBase}'.replace(/\/$/, '/')
    document.addEventListener('click', function(ev){
      var t = ev.target;
      // Walk up to nearest anchor
      while (t && t.tagName && t.tagName.toLowerCase() !== 'a') t = t.parentElement;
      if (!t || !t.getAttribute) return;
      var href = t.getAttribute('href');
      if (!href) return;
      // Ignore external and special schemes
      if (/^(https?:|mailto:|tel:|javascript:)/i.test(href)) return;
      ev.preventDefault();
      var path = href;
      if (href.startsWith('/')) path = href.slice(1);
      var target = BASE + path;
      if (window.top && window.top.location) {
        window.top.location.assign(target);
      } else {
        window.location.assign(target);
      }
    }, true);
  } catch(e) { /* noop */ }
})();</script>
</body>`
    );

  return (
    <>
      <iframe
        srcDoc={fullHTML}
        className="w-full h-screen border-0"
        title={project.project_name}
        sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-top-navigation-by-user-activation"
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