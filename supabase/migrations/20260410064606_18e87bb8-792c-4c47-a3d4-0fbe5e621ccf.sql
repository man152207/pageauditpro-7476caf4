
CREATE UNIQUE INDEX settings_scope_scopeid_key_unique
ON public.settings (scope, COALESCE(scope_id, '00000000-0000-0000-0000-000000000000'), key);
