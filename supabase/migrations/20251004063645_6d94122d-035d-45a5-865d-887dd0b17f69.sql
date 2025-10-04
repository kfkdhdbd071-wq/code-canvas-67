-- Add agent_messages column to store agent conversations
ALTER TABLE public.projects 
ADD COLUMN agent_messages jsonb DEFAULT '[]'::jsonb;