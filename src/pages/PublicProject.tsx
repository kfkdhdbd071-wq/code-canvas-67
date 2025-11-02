import { useEffect } from "react";
import { useParams } from "react-router-dom";

const PublicProject = () => {
  const { identifier } = useParams();

  useEffect(() => {
    if (identifier) {
      // Redirect to edge function that serves the project directly
      const edgeFunctionUrl = `https://tgbaxbcahikimzilubde.supabase.co/functions/v1/serve-project/${identifier}`;
      window.location.replace(edgeFunctionUrl);
    }
  }, [identifier]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
};

export default PublicProject;