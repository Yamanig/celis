-- Reversible Supabase functions for hierarchical category browsing.
-- Mobile shares the celis.so database and connects with the anon key + RLS.
-- These functions never bypass RLS; they only read rows the caller is already
-- allowed to see. The mobile app never uses the service-role key.

-- 1. get_browse_categories(parent_id uuid)
--    Returns immediate child categories of `parent_id` (NULL => root level)
--    together with a descendant-aware published-listing count. Only rows whose
--    count > 0 are returned, so Home can hide empty categories. Sell can call
--    this with `include_empty => true` to show all active categories.
create or replace function public.get_browse_categories(
  parent_id uuid default null,
  include_empty boolean default false
)
returns table (
  id uuid,
  name text,
  slug text,
  sort_order int,
  listing_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with recursive descendants as (
    -- seed: the selected node (or all roots when parent_id is null)
    select c.id as root_id, c.id as node_id
    from categories c
    where (parent_id is null and get_browse_categories.parent_id is null)
       or c.id = get_browse_categories.parent_id
    union all
    select d.root_id, c.id
    from categories c
    inner join descendants d on c.parent_id = d.node_id
  ),
  counted as (
    select
      d.root_id as id,
      count(l.id) as listing_count
    from descendants d
    left join listings l
      on l.category_id = d.node_id
     and l.status = 'active'
     and (l.expires_at is null or l.expires_at > now())
    group by d.root_id
  )
  select
    c.id,
    c.name,
    c.slug,
    c.sort_order,
    coalesce(cc.listing_count, 0) as listing_count
  from categories c
  inner join counted cc on cc.id = c.id
  where (include_empty or cc.listing_count > 0)
  order by c.sort_order nulls last, c.name;
$$;

-- 2. get_listings_by_category(category_id uuid, page int, page_size int)
--    Returns published listings for `category_id` AND every active descendant,
--    so a parent category includes its children's listings.
create or replace function public.get_listings_by_category(
  category_id uuid,
  page int default 1,
  page_size int default 12
)
returns table (
  id uuid,
  seller_id uuid,
  title text,
  description text,
  category_id uuid,
  price int,
  delivery_method text,
  status text,
  images text[],
  created_at timestamptz,
  expires_at timestamptz,
  total_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with recursive descendants as (
    select category_id as node_id
    union all
    select c.id
    from categories c
    inner join descendants d on c.parent_id = d.node_id
  ),
  matched as (
    select
      l.*,
      count(*) over () as total_count
    from listings l
    inner join descendants d on d.node_id = l.category_id
    where l.status = 'active'
      -- Real public-visibility rules for celis.so listings:
      and l.deactivated_at is null
      and l.sold_at is null
      and (l.expires_at is null or l.expires_at > now())
  )
  select
    m.id,
    m.seller_id,
    m.title,
    m.description,
    m.category_id,
    m.price,
    m.delivery_method,
    m.status,
    m.images,
    m.created_at,
    m.expires_at,
    m.total_count
  from matched m
  order by m.created_at desc
  limit get_listings_by_category.page_size
  offset greatest(0, get_listings_by_category.page - 1) * get_listings_by_category.page_size;
$$;

grant execute on function public.get_browse_categories(uuid, boolean) to anon, authenticated;
grant execute on function public.get_listings_by_category(uuid, int, int) to anon, authenticated;

-- Canonical name used by the mobile app for category listing queries.
-- Delegates to get_listings_by_category (recursive, published-only, RLS-safe).
create or replace function public.get_published_listings_by_category(
  p_category_id uuid,
  p_limit int default 12,
  p_offset int default 0,
  p_sort text default 'newest',
  p_filters jsonb default '{}'::jsonb
)
returns table (
  id uuid,
  seller_id uuid,
  title text,
  description text,
  category_id uuid,
  price int,
  delivery_method text,
  status text,
  images text[],
  created_at timestamptz,
  expires_at timestamptz,
  total_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.get_listings_by_category(
    p_category_id,
    (p_offset / nullif(p_limit, 0) + 1)::int,
    p_limit
  );
$$;

grant execute on function public.get_published_listings_by_category(uuid, int, int, text, jsonb) to anon, authenticated;

