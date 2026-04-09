
-- Create post status enum
CREATE TYPE public.post_status AS ENUM ('draft', 'scheduled', 'published', 'failed');

-- Create scheduled_posts table
CREATE TABLE public.scheduled_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  fb_connection_id UUID REFERENCES public.fb_connections(id) ON DELETE SET NULL,
  content TEXT NOT NULL DEFAULT '',
  media_urls TEXT[] DEFAULT '{}',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  status post_status NOT NULL DEFAULT 'draft',
  published_at TIMESTAMP WITH TIME ZONE,
  platform TEXT NOT NULL DEFAULT 'facebook',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create content_calendar table
CREATE TABLE public.content_calendar (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  color TEXT DEFAULT '#3B82F6',
  date DATE NOT NULL,
  scheduled_post_id UUID REFERENCES public.scheduled_posts(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_calendar ENABLE ROW LEVEL SECURITY;

-- RLS policies for scheduled_posts
CREATE POLICY "Users can view own scheduled posts"
  ON public.scheduled_posts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own scheduled posts"
  ON public.scheduled_posts FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own scheduled posts"
  ON public.scheduled_posts FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own scheduled posts"
  ON public.scheduled_posts FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Super admins can view all scheduled posts"
  ON public.scheduled_posts FOR SELECT
  USING (is_super_admin(auth.uid()));

-- RLS policies for content_calendar
CREATE POLICY "Users can view own calendar entries"
  ON public.content_calendar FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own calendar entries"
  ON public.content_calendar FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own calendar entries"
  ON public.content_calendar FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own calendar entries"
  ON public.content_calendar FOR DELETE
  USING (user_id = auth.uid());

-- Triggers for updated_at
CREATE TRIGGER update_scheduled_posts_updated_at
  BEFORE UPDATE ON public.scheduled_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_calendar_updated_at
  BEFORE UPDATE ON public.content_calendar
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
