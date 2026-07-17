-- Reversible teardown for 0020_category_browse_functions.sql.
drop function if exists public.get_listings_by_category(uuid, int, int);
drop function if exists public.get_browse_categories(uuid, boolean);
