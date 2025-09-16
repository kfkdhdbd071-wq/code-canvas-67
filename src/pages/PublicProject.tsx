import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Code } from "lucide-react";

const PublicProject = () => {
  const { identifier } = useParams();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (identifier) {
      fetchProject();
    }
  }, [identifier]);

  const fetchProject = async () => {
    let query = supabase
      .from('projects')
      .select('*')
      .eq('is_published', true);

    // Check if identifier is a custom URL or project ID
    if (identifier!.length === 36) {
      // Likely a UUID
      query = query.eq('id', identifier);
    } else {
      // Custom URL
      query = query.eq('custom_url', identifier);
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

  // Remove "EDIT WITH LOVABLE" text from published projects
  const cleanHTML = project.html_code
    .replace(/EDIT WITH LOVABLE/gi, '')
    .replace(/تحرير مع لوفابل/gi, '')
    .replace(/Edit with Lovable/gi, '');

  const fullHTML = cleanHTML
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
    <iframe
      srcDoc={fullHTML}
      className="w-full h-screen border-0"
      title={project.project_name}
      sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
    />
  );
};

export default PublicProject;