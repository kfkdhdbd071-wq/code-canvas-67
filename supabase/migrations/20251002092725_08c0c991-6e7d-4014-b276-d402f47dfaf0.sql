-- Add AI agents columns to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS ai_agents_status text,
ADD COLUMN IF NOT EXISTS ai_agents_progress integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_agents_idea text;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_projects_ai_agents_status ON public.projects(ai_agents_status) WHERE ai_agents_status IS NOT NULL;