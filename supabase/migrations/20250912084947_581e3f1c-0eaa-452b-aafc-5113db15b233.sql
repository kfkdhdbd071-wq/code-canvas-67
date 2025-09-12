-- Create articles table
CREATE TABLE public.articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  author_id UUID NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  published BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Create policies for articles
CREATE POLICY "Anyone can view published articles" 
ON public.articles 
FOR SELECT 
USING (published = true);

CREATE POLICY "Authenticated users can create articles" 
ON public.articles 
FOR INSERT 
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own articles" 
ON public.articles 
FOR UPDATE 
USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own articles" 
ON public.articles 
FOR DELETE 
USING (auth.uid() = author_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_articles_updated_at
BEFORE UPDATE ON public.articles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();