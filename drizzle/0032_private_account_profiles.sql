-- Restrict account tables to their owners and expose only the minimum public
-- identity fields needed to attribute marketplace sellers and reviewers.

BEGIN;

DROP POLICY IF EXISTS "profiles_public_read" ON public.profiles;
DROP POLICY IF EXISTS "users_public_read" ON public.users;
DROP POLICY IF EXISTS "profiles_owner_read" ON public.profiles;
DROP POLICY IF EXISTS "users_owner_read" ON public.users;

CREATE POLICY "profiles_owner_read" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "users_owner_read" ON public.users
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE OR REPLACE FUNCTION public.get_public_marketplace_profiles(
  p_user_ids uuid[]
)
RETURNS TABLE (
  id uuid,
  display_name text,
  avatar_url text,
  verified boolean,
  member_since timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF p_user_ids IS NULL OR cardinality(p_user_ids) = 0 THEN
    RETURN;
  END IF;

  IF cardinality(p_user_ids) > 100 THEN
    RAISE EXCEPTION 'At most 100 profile ids may be requested'
      USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.display_name::text,
    p.avatar_url::text,
    (u.verified_at IS NOT NULL) AS verified,
    u.created_at AS member_since
  FROM public.profiles AS p
  LEFT JOIN public.users AS u ON u.id = p.id
  WHERE p.id = ANY (p_user_ids);
END;
$$;

REVOKE ALL ON FUNCTION public.get_public_marketplace_profiles(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_marketplace_profiles(uuid[]) TO anon, authenticated;

COMMIT;
