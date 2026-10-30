-- =====================================================================
-- Online shop schema for Supabase
-- Run this once in Supabase → SQL Editor.
--
-- Security model
--   * Customers sign in with email OTP and can only read their own
--     profile and orders (RLS).
--   * The storefront reads products and promotions through two views
--     (store_products, active_promotions) that never expose cost prices.
--   * All admin reads/writes happen on the Next.js server with the
--     service-role key, after the server has checked profiles.role = 'admin'.
--   * Prices and totals are always calculated in the database
--     (place_order), never trusted from the browser.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Company settings (single row, id = 1)
-- ---------------------------------------------------------------------
create table if not exists public.company_settings (
  id                  int primary key default 1 check (id = 1),
  name                text not null default 'AvyPies Bakery',
  tagline             text,
  legal_name          text,
  registration_number text,
  vat_number          text,
  vat_percent         numeric(5,2) not null default 15 check (vat_percent between 0 and 100),
  currency            text not null default 'ZAR',
  address_line1       text,
  address_line2       text,
  city                text,
  province            text,
  postal_code         text,
  country             text default 'South Africa',
  email               text,
  phone               text,
  bank_details        text,
  logo_path           text,
  updated_at          timestamptz not null default now()
);
insert into public.company_settings (id) values (1) on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  email         text not null,
  role          text not null default 'customer' check (role in ('customer', 'admin')),
  first_name    text,
  last_name     text,
  phone         text,
  address_line1 text,
  address_line2 text,
  city          text,
  province      text,
  postal_code   text,
  created_at    timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Products (prices are EXCLUDING VAT)
-- ---------------------------------------------------------------------
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  sku         text unique,
  name        text not null,
  description text,
  cost_price  numeric(12,2) not null check (cost_price >= 0),
  price       numeric(12,2) not null,
  stock_qty   int not null default 0 check (stock_qty >= 0),
  image_path  text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint price_not_below_cost check (price >= cost_price)
);

-- ---------------------------------------------------------------------
-- Promotions
-- ---------------------------------------------------------------------
create table if not exists public.promotions (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  description      text,
  discount_percent numeric(5,2) not null check (discount_percent > 0 and discount_percent < 100),
  starts_at        timestamptz not null default now(),
  ends_at          timestamptz,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  constraint ends_after_start check (ends_at is null or ends_at > starts_at)
);

create table if not exists public.promotion_items (
  promotion_id uuid not null references public.promotions (id) on delete cascade,
  product_id   uuid not null references public.products (id) on delete cascade,
  primary key (promotion_id, product_id)
);

-- Highest discount (percent) that keeps the selling price >= cost price.
create or replace function public.max_discount_percent(p_price numeric, p_cost numeric)
returns numeric language sql immutable as $$
  select case when p_price > 0 then trunc((p_price - p_cost) / p_price * 100, 2) else 0 end;
$$;

-- Rule: a promotion discount may never be more than the product's markup.
create or replace function public.assert_promotion_within_markup(p_promotion_id uuid)
returns void language plpgsql set search_path = '' as $$
declare
  bad record;
begin
  select pr.name, public.max_discount_percent(pr.price, pr.cost_price) as max_pct
    into bad
  from public.promotions p
  join public.promotion_items pi on pi.promotion_id = p.id
  join public.products pr on pr.id = pi.product_id
  where p.id = p_promotion_id
    and p.discount_percent > public.max_discount_percent(pr.price, pr.cost_price)
  limit 1;

  if found then
    raise exception 'The discount is more than the markup on "%". The highest discount allowed for it is % percent.',
      bad.name, bad.max_pct;
  end if;
end;
$$;

create or replace function public.trg_promotion_items_check()
returns trigger language plpgsql set search_path = '' as $$
begin
  perform public.assert_promotion_within_markup(new.promotion_id);
  return null;
end;
$$;

drop trigger if exists promotion_items_markup_check on public.promotion_items;
create trigger promotion_items_markup_check
  after insert or update on public.promotion_items
  for each row execute function public.trg_promotion_items_check();

create or replace function public.trg_promotions_check()
returns trigger language plpgsql set search_path = '' as $$
begin
  perform public.assert_promotion_within_markup(new.id);
  return null;
end;
$$;

drop trigger if exists promotions_markup_check on public.promotions;
create trigger promotions_markup_check
  after update of discount_percent on public.promotions
  for each row execute function public.trg_promotions_check();

-- If an admin lowers a price (or raises the cost) of a product that is on a
-- running or upcoming promotion, the change is blocked when it would break the rule.
create or replace function public.trg_products_promo_check()
returns trigger language plpgsql set search_path = '' as $$
declare
  v_promo uuid;
begin
  for v_promo in
    select pi.promotion_id
    from public.promotion_items pi
    join public.promotions p on p.id = pi.promotion_id
    where pi.product_id = new.id and (p.ends_at is null or p.ends_at > now())
  loop
    perform public.assert_promotion_within_markup(v_promo);
  end loop;
  return null;
end;
$$;

drop trigger if exists products_promo_check on public.products;
create trigger products_promo_check
  after update of price, cost_price on public.products
  for each row execute function public.trg_products_promo_check();

-- Best running promotion discount for a product (0 when none).
create or replace function public.active_discount_percent(p_product_id uuid)
returns numeric language sql stable security definer set search_path = '' as $$
  select coalesce(max(p.discount_percent), 0)
  from public.promotion_items pi
  join public.promotions p on p.id = pi.promotion_id
  where pi.product_id = p_product_id
    and p.is_active
    and p.starts_at <= now()
    and (p.ends_at is null or p.ends_at > now());
$$;

-- Admin helper: create or update a promotion and its products in one transaction.
create or replace function public.save_promotion(
  p_id uuid,
  p_title text,
  p_description text,
  p_discount numeric,
  p_starts timestamptz,
  p_ends timestamptz,
  p_active boolean,
  p_product_ids uuid[]
) returns uuid language plpgsql set search_path = '' as $$
declare
  v_id uuid := p_id;
begin
  if coalesce(array_length(p_product_ids, 1), 0) = 0 then
    raise exception 'Select at least one product for the promotion.';
  end if;

  if v_id is null then
    insert into public.promotions (title, description, discount_percent, starts_at, ends_at, is_active)
    values (p_title, p_description, p_discount, coalesce(p_starts, now()), p_ends, p_active)
    returning id into v_id;
  else
    delete from public.promotion_items where promotion_id = v_id;
    update public.promotions
       set title = p_title, description = p_description, discount_percent = p_discount,
           starts_at = coalesce(p_starts, starts_at), ends_at = p_ends, is_active = p_active
     where id = v_id;
    if not found then
      raise exception 'Promotion not found.';
    end if;
  end if;

  insert into public.promotion_items (promotion_id, product_id)
  select distinct v_id, unnest(p_product_ids);

  return v_id;
end;
$$;

-- ---------------------------------------------------------------------
-- Orders
-- Flow: awaiting_payment -> paid -> ordered -> delivered
--       (awaiting_payment -> cancelled returns the stock)
-- ---------------------------------------------------------------------
do $$ begin
  create type public.order_status as enum ('awaiting_payment', 'paid', 'ordered', 'delivered', 'cancelled');
exception when duplicate_object then null; end $$;

create sequence if not exists public.invoice_number_seq start 1;

create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  order_number     bigint generated always as identity (start with 1001) unique,
  customer_id      uuid not null references public.profiles (id),
  status           public.order_status not null default 'awaiting_payment',
  subtotal         numeric(12,2) not null default 0,  -- excl. VAT, after discounts
  discount_total   numeric(12,2) not null default 0,  -- excl. VAT
  vat_percent      numeric(5,2)  not null,
  vat_amount       numeric(12,2) not null default 0,
  total            numeric(12,2) not null default 0,  -- incl. VAT
  customer_name    text,
  customer_email   text,
  customer_phone   text,
  delivery_address text,
  invoice_number   text unique,
  company_snapshot jsonb,                             -- company details at invoice time
  paid_at          timestamptz,
  ordered_at       timestamptz,
  delivered_at     timestamptz,
  cancelled_at     timestamptz,
  created_at       timestamptz not null default now()
);
create index if not exists orders_customer_idx on public.orders (customer_id, created_at desc);
create index if not exists orders_status_idx on public.orders (status, created_at desc);

create table if not exists public.order_items (
  id                        uuid primary key default gen_random_uuid(),
  order_id                  uuid not null references public.orders (id) on delete cascade,
  product_id                uuid references public.products (id) on delete set null,
  product_name              text not null,
  sku                       text,
  unit_price                numeric(12,2) not null,  -- list price excl. VAT
  discount_percent          numeric(5,2)  not null default 0,
  unit_price_after_discount numeric(12,2) not null,
  quantity                  int not null check (quantity > 0),
  line_total                numeric(12,2) not null   -- excl. VAT
);
create index if not exists order_items_order_idx on public.order_items (order_id);

create or replace function public.order_status_guard()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.status = old.status then
    return new;
  end if;

  if not (
       (old.status = 'awaiting_payment' and new.status in ('paid', 'cancelled'))
    or (old.status = 'paid'             and new.status = 'ordered')
    or (old.status = 'ordered'          and new.status = 'delivered')
  ) then
    raise exception 'An order can''t move from % to %.', old.status, new.status;
  end if;

  if new.status = 'paid' then
    new.paid_at := now();
    new.invoice_number := 'INV-' || lpad(nextval('public.invoice_number_seq')::text, 6, '0');
    select to_jsonb(c) into new.company_snapshot from public.company_settings c where c.id = 1;
  elsif new.status = 'ordered' then
    new.ordered_at := now();
  elsif new.status = 'delivered' then
    new.delivered_at := now();
  elsif new.status = 'cancelled' then
    new.cancelled_at := now();
    update public.products p
       set stock_qty = p.stock_qty + oi.quantity
      from public.order_items oi
     where oi.order_id = new.id and oi.product_id = p.id;
  end if;

  return new;
end;
$$;

drop trigger if exists orders_status_guard on public.orders;
create trigger orders_status_guard
  before update of status on public.orders
  for each row execute function public.order_status_guard();

-- Customer checkout. Called with: [{ "product_id": "...", "quantity": 2 }, ...]
create or replace function public.place_order(p_items jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_uid        uuid := auth.uid();
  v_profile    public.profiles%rowtype;
  v_vat        numeric;
  v_order_id   uuid;
  v_requested  int;
  v_found      int := 0;
  v_item       record;
  v_unit       numeric;
  v_subtotal   numeric := 0;
  v_discount   numeric := 0;
  v_vat_amount numeric;
begin
  if v_uid is null then
    raise exception 'Sign in to place an order.';
  end if;

  select * into v_profile from public.profiles where id = v_uid;
  if v_profile.first_name is null or v_profile.last_name is null or v_profile.phone is null
     or v_profile.address_line1 is null or v_profile.city is null then
    raise exception 'Add your name, phone number and delivery address to your profile before ordering.';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Your cart is empty.';
  end if;

  select vat_percent into v_vat from public.company_settings where id = 1;
  select count(distinct e->>'product_id') into v_requested from jsonb_array_elements(p_items) e;

  insert into public.orders (customer_id, vat_percent, customer_name, customer_email, customer_phone, delivery_address)
  values (
    v_uid, v_vat,
    v_profile.first_name || ' ' || v_profile.last_name,
    v_profile.email, v_profile.phone,
    concat_ws(', ', v_profile.address_line1, v_profile.address_line2, v_profile.city, v_profile.province, v_profile.postal_code)
  )
  returning id into v_order_id;

  for v_item in
    select pr.id, pr.name, pr.sku, pr.price, pr.cost_price, c.qty,
           least(public.active_discount_percent(pr.id),
                 public.max_discount_percent(pr.price, pr.cost_price)) as pct
    from (
      select (e->>'product_id')::uuid as product_id,
             sum(coalesce((e->>'quantity')::int, 0)) as qty
      from jsonb_array_elements(p_items) e
      group by 1
    ) c
    join public.products pr on pr.id = c.product_id and pr.is_active
  loop
    if v_item.qty < 1 or v_item.qty > 100 then
      raise exception 'Choose a quantity between 1 and 100 for %.', v_item.name;
    end if;

    update public.products
       set stock_qty = stock_qty - v_item.qty
     where id = v_item.id and stock_qty >= v_item.qty;
    if not found then
      raise exception 'There isn''t enough stock of % for that quantity. Lower the quantity and try again.', v_item.name;
    end if;

    -- never sell below cost, even after rounding
    v_unit := greatest(round(v_item.price * (1 - v_item.pct / 100), 2), v_item.cost_price);

    insert into public.order_items
      (order_id, product_id, product_name, sku, unit_price, discount_percent, unit_price_after_discount, quantity, line_total)
    values
      (v_order_id, v_item.id, v_item.name, v_item.sku, v_item.price, v_item.pct, v_unit, v_item.qty, v_unit * v_item.qty);

    v_subtotal := v_subtotal + v_unit * v_item.qty;
    v_discount := v_discount + (v_item.price - v_unit) * v_item.qty;
    v_found := v_found + 1;
  end loop;

  if v_found <> v_requested then
    raise exception 'Some items in your cart are no longer available. Refresh the store and try again.';
  end if;

  v_vat_amount := round(v_subtotal * v_vat / 100, 2);

  update public.orders
     set subtotal = v_subtotal, discount_total = v_discount,
         vat_amount = v_vat_amount, total = v_subtotal + v_vat_amount
   where id = v_order_id;

  return v_order_id;
end;
$$;

-- ---------------------------------------------------------------------
-- Storefront views (owned by postgres, so they read past RLS but only
-- expose safe columns — cost_price is never selected).
-- ---------------------------------------------------------------------
create or replace view public.store_products as
select pr.id, pr.sku, pr.name, pr.description, pr.price, pr.stock_qty, pr.image_path, pr.created_at,
       d.pct as discount_percent,
       greatest(round(pr.price * (1 - d.pct / 100), 2), pr.cost_price) as sale_price
from public.products pr
cross join lateral (
  select least(public.active_discount_percent(pr.id),
               public.max_discount_percent(pr.price, pr.cost_price)) as pct
) d
where pr.is_active;

create or replace view public.active_promotions as
select p.id, p.title, p.description, p.discount_percent, p.starts_at, p.ends_at,
       coalesce(array_agg(pi.product_id) filter (where pi.product_id is not null), '{}'::uuid[]) as product_ids
from public.promotions p
left join public.promotion_items pi on pi.promotion_id = p.id
where p.is_active and p.starts_at <= now() and (p.ends_at is null or p.ends_at > now())
group by p.id;

grant select on public.store_products, public.active_promotions to anon, authenticated;

-- ---------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------
alter table public.company_settings enable row level security;
alter table public.profiles         enable row level security;
alter table public.products         enable row level security;
alter table public.promotions       enable row level security;
alter table public.promotion_items  enable row level security;
alter table public.orders           enable row level security;
alter table public.order_items      enable row level security;

drop policy if exists "Company details are public" on public.company_settings;
create policy "Company details are public" on public.company_settings
  for select to anon, authenticated using (true);

drop policy if exists "Read own profile" on public.profiles;
create policy "Read own profile" on public.profiles
  for select to authenticated using (id = (select auth.uid()));

drop policy if exists "Update own profile" on public.profiles;
create policy "Update own profile" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Customers may edit their details, never their role or email.
revoke update on public.profiles from anon, authenticated;
grant update (first_name, last_name, phone, address_line1, address_line2, city, province, postal_code)
  on public.profiles to authenticated;

drop policy if exists "Read own orders" on public.orders;
create policy "Read own orders" on public.orders
  for select to authenticated using (customer_id = (select auth.uid()));

drop policy if exists "Read own order items" on public.order_items;
create policy "Read own order items" on public.order_items
  for select to authenticated using (
    exists (select 1 from public.orders o where o.id = order_id and o.customer_id = (select auth.uid()))
  );

-- products, promotions, promotion_items: no policies on purpose.
-- The storefront uses the views above; admins go through the service role.

revoke execute on function public.place_order(jsonb) from public, anon;
grant execute on function public.place_order(jsonb) to authenticated;

revoke execute on function public.save_promotion(uuid, text, text, numeric, timestamptz, timestamptz, boolean, uuid[])
  from public, anon, authenticated;
grant execute on function public.save_promotion(uuid, text, text, numeric, timestamptz, timestamptz, boolean, uuid[])
  to service_role;

-- ---------------------------------------------------------------------
-- Storage: public bucket for the logo and product photos.
-- Uploads only happen server-side with the service role.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('public-assets', 'public-assets', true)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- First admin: create the user in Authentication → Users → "Add user"
-- (with a password, auto-confirm), then run:
--
--   update public.profiles set role = 'admin' where email = 'you@example.com';
--
-- After that, admins can add other admins from /admin/users.
-- ---------------------------------------------------------------------
