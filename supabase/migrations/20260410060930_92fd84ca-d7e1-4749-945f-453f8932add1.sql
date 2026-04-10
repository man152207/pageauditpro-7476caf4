
-- Admin can view org users' scheduled posts
CREATE POLICY "Admins can view org scheduled posts"
ON public.scheduled_posts FOR SELECT TO authenticated
USING (
  is_admin_or_above(auth.uid()) AND
  EXISTS (
    SELECT 1 FROM profiles p1, profiles p2
    WHERE p1.user_id = auth.uid()
    AND p2.user_id = scheduled_posts.user_id
    AND p1.organization_id = p2.organization_id
    AND p1.organization_id IS NOT NULL
  )
);

-- Admin can view org users' fb connections
CREATE POLICY "Admins can view org fb connections"
ON public.fb_connections FOR SELECT TO authenticated
USING (
  is_admin_or_above(auth.uid()) AND
  EXISTS (
    SELECT 1 FROM profiles p1, profiles p2
    WHERE p1.user_id = auth.uid()
    AND p2.user_id = fb_connections.user_id
    AND p1.organization_id = p2.organization_id
    AND p1.organization_id IS NOT NULL
  )
);
