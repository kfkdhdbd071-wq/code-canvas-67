-- Add support for subpages/child projects
ALTER TABLE public.projects 
ADD COLUMN parent_project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
ADD COLUMN is_subpage BOOLEAN DEFAULT false,
ADD COLUMN subpage_route TEXT;

-- Create index for faster lookups
CREATE INDEX idx_projects_parent_id ON public.projects(parent_project_id) WHERE parent_project_id IS NOT NULL;
CREATE INDEX idx_projects_subpage_route ON public.projects(parent_project_id, subpage_route) WHERE is_subpage = true;