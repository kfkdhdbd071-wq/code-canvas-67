-- Add community and collaboration features to projects table
ALTER TABLE public.projects 
ADD COLUMN show_in_community boolean DEFAULT false,
ADD COLUMN view_count integer DEFAULT 0,
ADD COLUMN collaboration_token text;

-- Create index for community queries
CREATE INDEX idx_projects_community ON public.projects (show_in_community, created_at DESC) WHERE show_in_community = true;

-- Create index for collaboration token lookups
CREATE INDEX idx_projects_collaboration_token ON public.projects (collaboration_token) WHERE collaboration_token IS NOT NULL;

-- Add RLS policy for community projects
CREATE POLICY "Anyone can view community projects" 
ON public.projects 
FOR SELECT 
USING (show_in_community = true);

-- Add RLS policy for collaboration access
CREATE POLICY "Collaboration token allows access" 
ON public.projects 
FOR ALL
USING (
  collaboration_token IS NOT NULL AND 
  collaboration_token = current_setting('request.headers', true)::json->>'collaboration-token'
);

-- Function to increment view count
CREATE OR REPLACE FUNCTION public.increment_view_count(project_uuid uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.projects 
  SET view_count = view_count + 1 
  WHERE id = project_uuid;
$$;