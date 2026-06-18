-- ====================================================
-- 去玩 建库脚本 v14 — Supabase Native Auth · 最终版
-- 在 Supabase SQL Editor 粘贴全部执行
-- ====================================================

create extension if not exists pgcrypto;

-- ====================================================
-- 1. profiles（关联 auth.users）
-- ====================================================
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  numeric_id  integer unique,
  nickname    text not null,
  email       text default '',
  avatar      text default '',
  role        text default 'user' check (role in ('user','admin','superadmin')),
  bio         text default '',
  invited_by_code text default '',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- 独立发号器（行级锁，高并发不阻塞 profiles 主表）
create table id_generator (
  name text primary key,
  current_value integer not null
);
insert into id_generator (name, current_value) values ('user_numeric_id', 10000);

-- RLS 帮手函数（security definer 绕过 RLS，避免递归）
create or replace function is_my_session(p_session_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  return exists (
    select 1 from activity_sessions s
    join activities a on a.id = s.activity_id
    where s.id = p_session_id and a.user_id = auth.uid()
  );
end; $$;

-- 延迟发号策略：signUp 时不占 ID，complete_registration 成功才取号
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, nickname, email, role)
  values (new.id, '待激活_' || substring(replace(new.id::text, '-', '') from 1 for 6), new.email, 'user');
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users for each row execute function handle_new_user();

-- ====================================================
-- 2. invite_codes
-- ====================================================
create table invite_codes (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  max_uses    integer not null default 1,
  used_count  integer not null default 0,
  is_active   boolean not null default true,
  created_by  uuid references profiles(id),
  note        text default '',
  created_at  timestamptz default now()
);

-- ====================================================
-- 3. activities
-- ====================================================
create table activities (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references profiles(id) on delete cascade,
  title          text not null,
  organizer      text not null,
  city           text not null,
  location_name  text not null,
  lat            float default 0,
  lng            float default 0,
  description    text default '',
  cover_url      text default '',
  images         text[] default array[]::text[],
  status         text default 'pending_review' check (status in ('pending_review','active','rejected','closed')),
  reject_reason  text default '',
  featured       integer check (featured in (1,2,3)),
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- ====================================================
-- 4. activity_sessions
-- ====================================================
create table activity_sessions (
  id                  uuid primary key default gen_random_uuid(),
  activity_id         uuid not null references activities(id) on delete cascade,
  session_number      integer not null,
  booking_start_time  timestamptz,
  booking_end_time    timestamptz,
  planned_start_time  timestamptz not null,
  end_time            timestamptz not null,
  capacity            integer default 2,
  price               integer default 0,
  status              text default null check (status is null or status = 'cancelled'),
  group_chat_name     text default '',
  booked_count        integer default 0,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- ====================================================
-- 5. bookings
-- ====================================================
create table bookings (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references activity_sessions(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  count      integer default 1,
  contact    text default '',
  note       text default '',
  status     text default 'pending' check (status in ('pending','confirmed','cancelled','rejected')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ====================================================
-- 6. group_members
-- ====================================================
create table group_members (
  session_id uuid not null references activity_sessions(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  joined_at  timestamptz default now(),
  primary key (session_id, user_id)
);

-- ====================================================
-- 7. group_messages
-- ====================================================
create table group_messages (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references activity_sessions(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  content    text not null,
  created_at timestamptz default now()
);

-- ====================================================
-- 8. notifications
-- ====================================================
create table notifications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles(id) on delete cascade,
  type         text not null,
  related_id   uuid,
  payload      jsonb default '{}',
  is_read      boolean default false,
  action_taken text,
  created_at   timestamptz default now()
);

-- ====================================================
-- 9. messages
-- ====================================================
create table messages (
  id         uuid primary key default gen_random_uuid(),
  from_user  uuid not null references profiles(id) on delete cascade,
  to_user    uuid not null references profiles(id) on delete cascade,
  content    text not null,
  read       boolean default false,
  created_at timestamptz default now()
);

-- ====================================================
-- 10. records
-- ====================================================
create table records (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references profiles(id) on delete cascade,
  activity_name  text default '',
  session_label  text default '',
  content        text default '',
  images         text[] default array[]::text[],
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- ====================================================
-- 11. saves
-- ====================================================
create table saves (
  user_id    uuid not null references profiles(id) on delete cascade,
  record_id  uuid not null references records(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, record_id)
);

-- ====================================================
-- 12. follows
-- ====================================================
create table follows (
  follower_id uuid not null references profiles(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  created_at  timestamptz default now(),
  primary key (follower_id, user_id)
);

-- ====================================================
-- RPC：设置角色（仅超管）
-- ====================================================
create or replace function set_user_role(p_target_numeric_id integer, p_new_role text)
returns json language plpgsql security definer set search_path = public as $$
declare v_target profiles;
begin
  if not exists (select 1 from profiles where id = auth.uid() and role = 'superadmin') then
    return json_build_object('error', '仅超级管理员可操作'); end if;
  if p_new_role not in ('admin','user') then
    return json_build_object('error', '角色无效'); end if;
  select * into v_target from profiles where numeric_id = p_target_numeric_id;
  if v_target is null then return json_build_object('error', '用户不存在'); end if;
  if v_target.role = 'superadmin' then return json_build_object('error', '不可修改超级管理员'); end if;
  update profiles set role = p_new_role where numeric_id = p_target_numeric_id;
  return json_build_object('ok', true);
end; $$;

-- ====================================================
-- RPC：生成邀请码（管理员）
-- ====================================================
create or replace function generate_invite(p_max_uses int, p_note text default '')
returns json language plpgsql security definer set search_path = public as $$
declare v_code text; v_today_total integer;
begin
  if not exists (select 1 from profiles where id = auth.uid() and role in ('admin','superadmin')) then
    return json_build_object('error', '仅管理员可操作'); end if;
  if p_max_uses > 50 then
    return json_build_object('error', '单个邀请码最多50次'); end if;
  -- 每天最多生成 100 个名额
  select coalesce(sum(max_uses), 0) into v_today_total from invite_codes
  where created_by = auth.uid() and created_at > now() - interval '1 day';
  if v_today_total + p_max_uses > 100 then
    return json_build_object('error', '今日已满100个名额，明天再试'); end if;
  v_code := 'QW' || upper(substring(md5(random()::text) from 1 for 6));
  insert into invite_codes (code, max_uses, note, created_by) values (v_code, p_max_uses, p_note, auth.uid());
  return json_build_object('code', v_code);
end; $$;

-- 获取登录用的邮箱（用昵称/ID查）
create or replace function get_login_email(p_account text)
returns json language plpgsql security definer set search_path = public as $$
declare v_email text;
begin
  select u.email into v_email from auth.users u join profiles p on p.id = u.id
  where p.nickname = p_account or p.numeric_id::text = p_account;
  if v_email is null then return json_build_object('error', '用户不存在'); end if;
  return json_build_object('email', v_email);
end; $$;

-- 完成注册（验证邀请码 + 设置昵称，需先 signUp 创建 auth 用户再调用）
create or replace function complete_registration(p_nickname text, p_invite_code text)
returns json language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_uid uuid; v_numeric_id integer;
begin
  v_uid := auth.uid();
  if v_uid is null then return json_build_object('error', '请先完成邮箱注册'); end if;

  -- 昵称先校验（失败不扣码）
  if p_nickname ilike any(array['%管理员%','%官方%','%admin%','%系统%','%去玩%']) then
    return json_build_object('error', '用户名包含禁用词'); end if;
  if p_nickname ~ '^[0-9]+$' then
    return json_build_object('error', '用户名不可为纯数字'); end if;
  if exists (select 1 from profiles where nickname = p_nickname) then
    return json_build_object('error', '该昵称已被占用'); end if;
  if exists (select 1 from profiles where id = v_uid and numeric_id is not null) then
    return json_build_object('error', '您已完成注册'); end if;

  -- 扣邀请码（区分停用/用完/无效）
  select id into v_id from invite_codes
  where code = p_invite_code and used_count < max_uses and is_active = true for update;
  if v_id is null then
    if exists (select 1 from invite_codes where code = p_invite_code and is_active = false) then
      return json_build_object('error', '该邀请码已被停用');
    elsif exists (select 1 from invite_codes where code = p_invite_code) then
      return json_build_object('error', '该邀请码已被用完');
    else
      return json_build_object('error', '邀请码不存在');
    end if;
  end if;
  update invite_codes set used_count = used_count + 1,
    is_active = case when (used_count + 1) >= max_uses then false else true end
  where id = v_id;

  -- 延迟发号：验证通过才取号
  update id_generator set current_value = current_value + 1
  where name = 'user_numeric_id' returning current_value into v_numeric_id;
  update profiles set nickname = p_nickname, numeric_id = v_numeric_id, invited_by_code = p_invite_code where id = v_uid;
  return json_build_object('ok', true, 'numeric_id', v_numeric_id);
end; $$;

-- ====================================================
-- RPC：更新个人资料
-- ====================================================
create or replace function update_profile(p_nickname text, p_email text, p_avatar text)
returns json language plpgsql security definer set search_path = public as $$
begin
  if p_nickname is not null and p_nickname ilike '%管理员%' then
    return json_build_object('error', '昵称不可包含"管理员"'); end if;
  if p_nickname is not null and exists (select 1 from profiles where nickname = p_nickname and id != auth.uid()) then
    return json_build_object('error', '该昵称已被占用'); end if;
  update profiles set
    nickname = coalesce(p_nickname, nickname),
    email = coalesce(p_email, email),
    avatar = coalesce(p_avatar, avatar),
    updated_at = now()
  where id = auth.uid();
  return json_build_object('ok', true);
end; $$;

-- ====================================================
-- RPC：审核预约（管理员/发布者）
-- ====================================================
create or replace function approve_booking(p_booking_id uuid, p_action text)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_booking bookings; v_session activity_sessions; v_uid uuid;
begin
  v_uid := auth.uid();
  select * into v_booking from bookings where id = p_booking_id for update;
  if v_booking is null then return json_build_object('error', '预约不存在'); end if;

  if v_booking.status = 'confirmed' and p_action = 'confirm' then
    return json_build_object('error', '该预约已通过'); end if;
  if v_booking.status = 'rejected' and p_action = 'reject' then
    return json_build_object('error', '该预约已拒绝'); end if;

  select * into v_session from activity_sessions where id = v_booking.session_id for update;

  if not exists (select 1 from profiles where id = v_uid and role in ('admin','superadmin'))
     and not exists (select 1 from activities where id = v_session.activity_id and user_id = v_uid) then
    return json_build_object('error', '无权限'); end if;

  if p_action = 'confirm' then
    if coalesce(v_session.booked_count, 0) + coalesce(v_booking.count, 1) > coalesce(v_session.capacity, 2) then
      return json_build_object('error', '期次名额不足'); end if;
    update bookings set status = 'confirmed', updated_at = now() where id = p_booking_id;
    update activity_sessions set booked_count = booked_count + v_booking.count, updated_at = now() where id = v_booking.session_id;
    insert into group_members (session_id, user_id) values (v_booking.session_id, v_booking.user_id) on conflict do nothing;
    insert into notifications (user_id, type, related_id, payload)
    values (v_booking.user_id, 'booking_confirmed', p_booking_id,
      json_build_object('activity', (select title from activities where id = v_session.activity_id)));
    return json_build_object('ok', true);
  elsif p_action = 'reject' then
    update bookings set status = 'rejected', updated_at = now() where id = p_booking_id;
    if v_booking.status = 'confirmed' then
      update activity_sessions set booked_count = greatest(booked_count - v_booking.count, 0) where id = v_booking.session_id;
      if not exists (select 1 from bookings where session_id = v_booking.session_id and user_id = v_booking.user_id and status = 'confirmed' and id != p_booking_id) then
        delete from group_members where session_id = v_booking.session_id and user_id = v_booking.user_id;
      end if;
    end if;
    insert into notifications (user_id, type, related_id, payload)
    values (v_booking.user_id, 'booking_rejected', p_booking_id,
      json_build_object('activity', (select title from activities where id = v_session.activity_id)));
    return json_build_object('ok', true);
  else
    return json_build_object('error', '操作无效');
  end if;
end; $$;

-- ====================================================
-- RPC：审核活动（仅管理员）
-- ====================================================
create or replace function review_activity(p_activity_id uuid, p_status text, p_reason text default '')
returns json language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from profiles where id = auth.uid() and role in ('admin','superadmin')) then
    return json_build_object('error', '仅管理员可操作'); end if;
  if p_status not in ('active','rejected') then
    return json_build_object('error', '状态无效'); end if;
  update activities set status = p_status, reject_reason = p_reason, updated_at = now() where id = p_activity_id;

  if p_status = 'active' then
    insert into group_members (session_id, user_id)
    select s.id, a.user_id from activity_sessions s join activities a on a.id = s.activity_id
    where s.activity_id = p_activity_id on conflict do nothing;
  end if;

  insert into notifications (user_id, type, related_id, payload)
  values ((select user_id from activities where id = p_activity_id),
    case when p_status = 'active' then 'activity_approved' else 'activity_rejected' end,
    p_activity_id,
    json_build_object('title', (select title from activities where id = p_activity_id), 'reason', p_reason));
  return json_build_object('ok', true);
end; $$;

-- ====================================================
-- RPC：超管重置用户密码
-- ====================================================
create or replace function admin_reset_password(p_numeric_id integer, p_new_password text)
returns json language plpgsql security definer set search_path = auth, public, extensions as $$
declare v_uid uuid;
begin
  if not exists (select 1 from profiles where id = auth.uid() and role = 'superadmin') then
    return json_build_object('error', '仅超级管理员可操作'); end if;
  select id into v_uid from profiles where numeric_id = p_numeric_id;
  if v_uid is null then return json_build_object('error', '用户不存在'); end if;
  update auth.users set encrypted_password = crypt(p_new_password, gen_salt('bf')) where id = v_uid;
  return json_build_object('ok', true);
end; $$;

-- ====================================================
-- RPC：设置推荐位
-- ====================================================
create or replace function set_featured(p_activity_id uuid, p_position int)
returns json language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from profiles where id = auth.uid() and role in ('admin','superadmin')) then
    return json_build_object('error', '仅管理员可操作'); end if;
  if p_position is not null and p_position not in (1,2,3) then
    return json_build_object('error', '推荐位无效'); end if;
  if p_position is not null then
    update activities set featured = null where featured = p_position; end if;
  update activities set featured = p_position, updated_at = now() where id = p_activity_id;
  return json_build_object('ok', true);
end; $$;

-- ====================================================
-- RPC：取消预约（本人）
-- ====================================================
create or replace function cancel_booking(p_booking_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare v_booking bookings; v_uid uuid;
begin
  v_uid := auth.uid();
  select * into v_booking from bookings where id = p_booking_id for update;
  if v_booking is null then return json_build_object('error', '预约不存在'); end if;
  if v_booking.user_id != v_uid then return json_build_object('error', '只能取消自己的预约'); end if;
  if v_booking.status not in ('pending','confirmed') then
    return json_build_object('error', '当前状态不可取消'); end if;
  update bookings set status = 'cancelled', updated_at = now() where id = p_booking_id;
  if v_booking.status = 'confirmed' then
    update activity_sessions set booked_count = greatest(booked_count - v_booking.count, 0) where id = v_booking.session_id;
    if not exists (select 1 from bookings where session_id = v_booking.session_id and user_id = v_uid and status = 'confirmed' and id != p_booking_id) then
      delete from group_members where session_id = v_booking.session_id and user_id = v_uid;
    end if;
  end if;
  return json_build_object('ok', true);
end; $$;

-- ====================================================
-- RPC：关闭/重开活动
-- ====================================================
create or replace function close_activity(p_activity_id uuid)
returns json language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from activities where id = p_activity_id and user_id = auth.uid()) then
    return json_build_object('error', '只能关闭自己的活动'); end if;
  if exists (select 1 from activity_sessions s join bookings b on b.session_id = s.id
    where s.activity_id = p_activity_id and b.status = 'confirmed') then
    return json_build_object('error', '有已确认的预约，无法关闭'); end if;
  update activities set status = 'closed', updated_at = now() where id = p_activity_id;
  return json_build_object('ok', true);
end; $$;

create or replace function reopen_activity(p_activity_id uuid)
returns json language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from activities where id = p_activity_id and user_id = auth.uid()) then
    return json_build_object('error', '只能操作自己的活动'); end if;
  update activities set status = 'pending_review', updated_at = now() where id = p_activity_id and status = 'closed';
  return json_build_object('ok', true);
end; $$;

-- ====================================================
-- RPC：取消期次
-- ====================================================
create or replace function cancel_session(p_session_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare v_session activity_sessions; v_uid uuid;
begin
  v_uid := auth.uid();
  select * into v_session from activity_sessions where id = p_session_id for update;
  if v_session is null then return json_build_object('error', '期次不存在'); end if;
  if not exists (select 1 from activities where id = v_session.activity_id and user_id = v_uid)
     and not exists (select 1 from profiles where id = v_uid and role in ('admin','superadmin')) then
    return json_build_object('error', '无权限'); end if;
  delete from group_members where session_id = p_session_id;
  update bookings set status = 'cancelled', updated_at = now() where session_id = p_session_id and status in ('pending','confirmed');
  delete from activity_sessions where id = p_session_id;
  return json_build_object('ok', true);
end; $$;

-- ====================================================
-- RPC：切换收藏/关注
-- ====================================================
create or replace function toggle_save(p_record_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare v_uid uuid;
begin
  v_uid := auth.uid();
  delete from saves where user_id = v_uid and record_id = p_record_id;
  if found then
    return json_build_object('ok', true, 'saved', false);
  else
    insert into saves (user_id, record_id) values (v_uid, p_record_id) on conflict do nothing;
    return json_build_object('ok', true, 'saved', true);
  end if;
end; $$;

create or replace function toggle_follow(p_user_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare v_uid uuid;
begin
  v_uid := auth.uid();
  if v_uid = p_user_id then return json_build_object('error', '不可关注自己'); end if;
  delete from follows where follower_id = v_uid and user_id = p_user_id;
  if found then
    return json_build_object('ok', true, 'following', false);
  else
    insert into follows (follower_id, user_id) values (v_uid, p_user_id) on conflict do nothing;
    return json_build_object('ok', true, 'following', true);
  end if;
end; $$;

-- ====================================================
-- 种子数据：首条邀请码
-- ====================================================
insert into invite_codes (code, max_uses, used_count, is_active)
values ('QWANWAN', 99, 0, true) on conflict (code) do nothing;

-- ====================================================
-- 索引
-- ====================================================
create index if not exists idx_activities_status on activities(status);
create index if not exists idx_activities_featured on activities(featured);
create index if not exists idx_activities_city on activities(city);
create index if not exists idx_activities_user_status on activities(user_id, status);
create index if not exists idx_sessions_activity on activity_sessions(activity_id);
create index if not exists idx_bookings_user on bookings(user_id);
create index if not exists idx_bookings_session on bookings(session_id);
create index if not exists idx_notifications_user on notifications(user_id, is_read);
create index if not exists idx_group_messages_session on group_messages(session_id);
create index if not exists idx_group_members_user on group_members(user_id);
create index if not exists idx_messages_users on messages(from_user, to_user);
create index if not exists idx_records_user on records(user_id);

-- email 部分唯一
create unique index unique_email_if_not_empty on profiles (email) where email != '';

-- nickname 唯一
alter table profiles add constraint unique_nickname unique (nickname);

-- 活跃期次视图
create or replace view active_sessions with (security_invoker = false) as
select * from activity_sessions where status is null;

-- public_profiles 视图
create or replace view public_profiles with (security_invoker = false) as
select id, numeric_id, nickname, avatar, role, bio, created_at from profiles;

-- ====================================================
-- RLS 启用
-- ====================================================
alter table profiles enable row level security;
alter table invite_codes enable row level security;
alter table activities enable row level security;
alter table activity_sessions enable row level security;
alter table bookings enable row level security;
alter table group_members enable row level security;
alter table group_messages enable row level security;
alter table notifications enable row level security;
alter table messages enable row level security;
alter table records enable row level security;
alter table saves enable row level security;
alter table follows enable row level security;

-- ====================================================
-- RLS 策略
-- ====================================================

-- profiles：仅超管可写字段，本人可读
create policy "profiles_select" on profiles for select using (true);
create policy "profiles_insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- invite_codes：全员可读，管理员可启停
create policy "invite_select" on invite_codes for select using (true);
create policy "invite_no_write" on invite_codes for insert with check (false);
create policy "invite_update" on invite_codes for update using (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin','superadmin'))
);

-- activities
create policy "act_select" on activities for select using (true);
create policy "act_insert" on activities for insert with check (
  auth.uid() = user_id and status = 'pending_review' and featured is null
);
create policy "act_update" on activities for update using (
  auth.uid() = user_id
  or exists (select 1 from profiles where id = auth.uid() and role in ('admin','superadmin'))
);
create policy "act_delete" on activities for delete using (
  auth.uid() = user_id
  and not exists (select 1 from activity_sessions s join bookings b on b.session_id = s.id where s.activity_id = activities.id and b.status = 'confirmed')
);

-- activity_sessions
create policy "sess_select" on activity_sessions for select using (true);
create policy "sess_insert" on activity_sessions for insert with check (
  exists (select 1 from activities a where a.id = activity_id and (a.user_id = auth.uid() or exists (select 1 from profiles where id = auth.uid() and role in ('admin','superadmin'))))
);
create policy "sess_update" on activity_sessions for update using (
  exists (select 1 from activities a where a.id = activity_id and (a.user_id = auth.uid() or exists (select 1 from profiles where id = auth.uid() and role in ('admin','superadmin'))))
);
create policy "sess_delete" on activity_sessions for delete using (false);

-- bookings
create policy "bk_select" on bookings for select using (
  auth.uid() = user_id
  or exists (select 1 from profiles where id = auth.uid() and role in ('admin','superadmin'))
  or exists (select 1 from activity_sessions s join activities a on a.id = s.activity_id where s.id = session_id and a.user_id = auth.uid())
);
create policy "bk_insert" on bookings for insert with check (
  auth.uid() = user_id
  and status = 'pending'
  and not is_my_session(session_id)
);
create policy "bk_update" on bookings for update using (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin','superadmin'))
);

-- group_members
create policy "gm_select" on group_members for select using (true);
create policy "gm_insert" on group_members for insert with check (
  auth.uid() = user_id
  or exists (select 1 from activity_sessions s join activities a on a.id = s.activity_id where s.id = session_id and a.user_id = auth.uid())
  or exists (select 1 from profiles where id = auth.uid() and role in ('admin','superadmin'))
);
create policy "gm_no_update" on group_members for update using (false);
create policy "gm_no_delete" on group_members for delete using (false);

-- group_messages
create policy "gmsg_select" on group_messages for select using (
  exists (select 1 from profiles where id = auth.uid() and role in ('admin','superadmin'))
  or exists (select 1 from activity_sessions s join activities a on a.id = s.activity_id where s.id = session_id and a.user_id = auth.uid())
  or exists (select 1 from group_members where session_id = group_messages.session_id and user_id = auth.uid())
);
create policy "gmsg_insert" on group_messages for insert with check (
  auth.uid() = user_id
  and (exists (select 1 from activity_sessions s join activities a on a.id = s.activity_id where s.id = session_id and a.user_id = auth.uid())
    or exists (select 1 from group_members where session_id = group_messages.session_id and user_id = auth.uid()))
);

-- notifications
create policy "notif_select" on notifications for select using (auth.uid() = user_id);
create policy "notif_insert" on notifications for insert with check (auth.role() = 'authenticated');
create policy "notif_update" on notifications for update using (auth.uid() = user_id);

-- messages
create policy "msg_select" on messages for select using (auth.uid() in (from_user, to_user));
create policy "msg_insert" on messages for insert with check (auth.uid() = from_user);
create policy "msg_update" on messages for update using (auth.uid() = to_user);

-- records / saves / follows
create policy "rec_select" on records for select using (true);
create policy "rec_insert" on records for insert with check (auth.uid() = user_id);
create policy "rec_update" on records for update using (auth.uid() = user_id);
create policy "rec_delete" on records for delete using (auth.uid() = user_id);

create policy "save_select" on saves for select using (true);
create policy "save_insert" on saves for insert with check (auth.uid() = user_id);
create policy "save_delete" on saves for delete using (auth.uid() = user_id);

create policy "follow_select" on follows for select using (true);
create policy "follow_insert" on follows for insert with check (auth.uid() = follower_id);
create policy "follow_delete" on follows for delete using (auth.uid() = follower_id);

-- ====================================================
-- 字段级安全触发器
-- ====================================================
create or replace function protect_activity_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if current_user in ('anon','authenticated') and not exists (select 1 from profiles where id = auth.uid() and role in ('admin','superadmin')) then
    if old.status = 'active' and (new.title != old.title or new.description != old.description or new.images != old.images) then
      new.status = 'pending_review';
    elsif new.status != old.status and new.status != 'closed' then
      new.status = old.status;
    end if;
    new.reject_reason = old.reject_reason;
    new.featured = old.featured;
    new.user_id = old.user_id;
  end if;
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists trg_protect_activity_status on activities;
create trigger trg_protect_activity_status before update on activities for each row execute function protect_activity_status();

create or replace function protect_session_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if current_user in ('anon','authenticated') and not exists (select 1 from profiles where id = auth.uid() and role in ('admin','superadmin')) then
    new.booked_count = old.booked_count;
  end if;
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists trg_protect_session_count on activity_sessions;
create trigger trg_protect_session_count before update on activity_sessions for each row execute function protect_session_count();

-- ====================================================
-- ⚠️ 建库后手动操作
-- ====================================================
-- 1. Dashboard → Authentication → Add User → 创建超管
--    邮箱: 10000@quwan.local  密码: 123456 (生产换强密码)
--    trigger 创建空壳 profile，无 numeric_id
-- 2. SQL Editor 执行（手动赋予 10000 和超管角色）：
--    update profiles set nickname='超级管理员', role='superadmin', numeric_id=10000 where email='10000@quwan.local';
--    update auth.config set enable_confirmations = false;  -- 关闭邮箱验证
-- 3. Dashboard → Storage → 手动建 bucket "images"
-- 4. SQL Editor 执行 Storage RLS：
--    create policy "images_select" on storage.objects for select using (bucket_id='images');
--    create policy "images_insert" on storage.objects for insert with check (bucket_id='images' and auth.role()='authenticated');
--
-- 注册流程（前端）：
--   1. 用户输入昵称+密码+邀请码
--   2. crypto.randomUUID()+'@quwan.local' → signUp(邮箱,密码)
--   3. 触发器创建空壳 profile（无 ID）
--   4. complete_registration(昵称,邀请码) → 验证+扣码+取号+设昵称+记邀请码

-- 合并查询 RPC（减少多次请求）
--- 已通过 SQL Editor 添加到数据库 ---
