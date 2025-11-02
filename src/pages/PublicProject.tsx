import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Code } from "lucide-react";

const PublicProject = () => {
  const { identifier } = useParams();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (identifier) {
      fetchProject();
    }
  }, [identifier]);

  useEffect(() => {
    if (project && containerRef.current) {
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
      
      // Create a blob URL for the HTML content
      const blob = new Blob([fullHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Navigate to the blob URL to display content without iframe restrictions
      window.location.replace(url);
    }
  }, [project]);

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

  return (
    <div ref={containerRef} className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
};

export default PublicProject;