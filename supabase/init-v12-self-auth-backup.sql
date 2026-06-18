-- ====================================================
-- 去玩 建库脚本 v10 最终版 — 全链路安全 + bcrypt + Header Token
-- 在 Supabase SQL Editor 粘贴全部执行
-- ====================================================

-- 引入加密扩展
create extension if not exists pgcrypto;

-- 1. profiles 用户
create table profiles (
  id              uuid primary key default gen_random_uuid(),
  numeric_id      integer not null unique,
  nickname        text not null,
  password        text not null,
  email           text default '',
  avatar          text default '',
  role            text default 'user' check (role in ('user','admin','superadmin')),
  bio             text default '',
  session_token   uuid default null,
  session_expires timestamp default null,
  created_at      timestamp default now()
);

-- 2. invite_codes 邀请码
create table invite_codes (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  max_uses    integer not null default 1,
  used_count  integer not null default 0,
  is_active   boolean not null default true,
  created_by  uuid references profiles(id),
  created_at  timestamp default now()
);

-- 3. activities 活动
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
  created_at     timestamp default now()
);

-- 4. activity_sessions 期次
create table activity_sessions (
  id                  uuid primary key default gen_random_uuid(),
  activity_id         uuid not null references activities(id) on delete cascade,
  session_number      integer not null,
  booking_start_time  timestamp,
  booking_end_time    timestamp,
  planned_start_time  timestamp not null,
  end_time            timestamp not null,
  capacity            integer default 2,
  price               integer default 0,
  status              text default null check (status is null or status = 'cancelled'),
  group_chat_name     text default '',
  booked_count        integer default 0,
  created_at          timestamp default now()
);

-- 5. bookings 预约
create table bookings (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references activity_sessions(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  count      integer default 1,
  contact    text default '',
  note       text default '',
  status     text default 'pending' check (status in ('pending','confirmed','cancelled','rejected')),
  created_at timestamp default now()
);

-- 6. group_members 群成员
create table group_members (
  session_id uuid not null references activity_sessions(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  joined_at  timestamp default now(),
  primary key (session_id, user_id)
);

-- 7. group_messages 群消息
create table group_messages (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references activity_sessions(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  content    text not null,
  created_at timestamp default now()
);

-- 8. notifications 系统通知
create table notifications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles(id) on delete cascade,
  type         text not null,
  related_id   uuid,
  payload      jsonb default '{}',
  is_read      boolean default false,
  action_taken text,
  created_at   timestamp default now()
);

-- 9. messages 私信
create table messages (
  id         uuid primary key default gen_random_uuid(),
  from_user  uuid not null references profiles(id) on delete cascade,
  to_user    uuid not null references profiles(id) on delete cascade,
  content    text not null,
  read       boolean default false,
  created_at timestamp default now()
);

-- 10. records 体验记录
create table records (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references profiles(id) on delete cascade,
  activity_name  text default '',
  session_label  text default '',
  content        text default '',
  images         text[] default array[]::text[],
  created_at     timestamp default now()
);

-- 11. saves 收藏
create table saves (
  user_id    uuid not null references profiles(id) on delete cascade,
  record_id  uuid not null references records(id) on delete cascade,
  created_at timestamp default now(),
  primary key (user_id, record_id)
);

-- 12. follows 关注
create table follows (
  follower_id uuid not null references profiles(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  created_at  timestamp default now(),
  primary key (follower_id, user_id)
);

-- ====================================================
-- 内部函数：根据 token 找用户
-- ====================================================
create or replace function auth_by_token(p_token uuid)
returns profiles language plpgsql security definer set search_path = public as $$
declare u profiles;
begin
  select * into u from profiles where session_token = p_token and session_expires > now();
  return u;
end; $$;

-- 从请求 Header 读取 token
create or replace function get_token_from_header()
returns uuid language plpgsql stable as $$
begin
  return nullif(current_setting('request.headers', true)::json->>'x-app-token', '')::uuid;
end; $$;

-- 根据 header token 查用户
create or replace function current_user_from_header()
returns profiles language plpgsql stable security definer set search_path = public as $$
declare u profiles;
begin
  select * into u from profiles where session_token = get_token_from_header() and session_expires > now();
  return u;
end; $$;

-- ====================================================
-- 注册（无需 token）
-- ====================================================
create or replace function register(p_nickname text, p_password text, p_invite_code text)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_id uuid; v_numeric_id integer;
begin
  if p_nickname ilike '%管理员%' then
    return json_build_object('error', '用户名不可包含"管理员"'); end if;
  if p_nickname ~ '^[0-9]+$' then
    return json_build_object('error', '用户名不可为纯数字'); end if;
  if p_nickname ilike any(array['%管理员%','%官方%','%admin%','%系统%','%去玩%']) then
    return json_build_object('error', '用户名包含禁用词'); end if;
  if exists (select 1 from profiles where nickname = p_nickname) then
    return json_build_object('error', '该昵称已被占用，请换一个'); end if;

  -- 原子扣减邀请码，防并发超卖
  update invite_codes set used_count = used_count + 1
  where code = p_invite_code and is_active = true and used_count < max_uses
  returning id into v_id;
  if v_id is null then return json_build_object('error', '邀请码无效或已用完'); end if;

  -- 用完自动禁用
  update invite_codes set is_active = false
  where code = p_invite_code and used_count >= max_uses;

  select coalesce(max(numeric_id), 10000) + 1 into v_numeric_id from profiles;
  insert into profiles (numeric_id, nickname, password, role)
    values (v_numeric_id, p_nickname, crypt(p_password, gen_salt('bf')), 'user') returning id into v_id;
  return json_build_object('id', v_id, 'numeric_id', v_numeric_id, 'nickname', p_nickname, 'role', 'user');
end; $$;

-- ====================================================
-- 登录（生成 session_token，有效期 30 天）
-- ====================================================
create or replace function login(p_account text, p_password text)
returns json language plpgsql security definer set search_path = public as $$
declare
  u profiles; v_token uuid;
begin
  if p_account is null or p_account = '' then
    return json_build_object('error', '用户名或密码错误'); end if;
  select * into u from profiles
    where nickname = p_account or numeric_id::text = p_account
       or (email = p_account and email != '');
  if u is null or u.password != crypt(p_password, u.password) then
    return json_build_object('error', '用户名或密码错误'); end if;
  v_token := gen_random_uuid();
  update profiles set session_token = v_token, session_expires = now() + interval '30 days' where id = u.id;
  return json_build_object(
    'id', u.id, 'numeric_id', u.numeric_id,
    'nickname', u.nickname, 'role', u.role,
    'avatar', u.avatar, 'email', u.email,
    'session_token', v_token
  );
end; $$;

-- ====================================================
-- 改密码（token）
-- ====================================================
create or replace function change_password(p_old_password text, p_new_password text)
returns json language plpgsql security definer set search_path = public as $$
declare u profiles; v_token uuid;
begin
  v_token := get_token_from_header();
  select * into u from auth_by_token(v_token);
  if u.id is null then return json_build_object('error', '请重新登录'); end if;
  if u.password != crypt(p_old_password, u.password) then
    return json_build_object('error', '旧密码错误'); end if;
  update profiles set password = crypt(p_new_password, gen_salt('bf')) where id = u.id;
  return json_build_object('ok', true);
end; $$;

-- ====================================================
-- 更新资料（token）
-- ====================================================
create or replace function update_profile(p_nickname text, p_email text, p_avatar text)
returns json language plpgsql security definer set search_path = public as $$
declare u profiles; v_token uuid;
begin
  v_token := get_token_from_header();
  select * into u from auth_by_token(v_token);
  if u.id is null then return json_build_object('error', '请重新登录'); end if;
  if p_nickname is not null and p_nickname ilike '%管理员%' then
    return json_build_object('error', '昵称不可包含"管理员"'); end if;
  if p_nickname is not null and exists (select 1 from profiles where nickname = p_nickname and id != u.id) then
    return json_build_object('error', '该昵称已被占用'); end if;
  update profiles set
    nickname = coalesce(p_nickname, nickname),
    email = coalesce(p_email, email),
    avatar = coalesce(p_avatar, avatar)
  where id = u.id;
  return json_build_object('ok', true);
end; $$;

-- ====================================================
-- 设置角色（token，仅超管）
-- ====================================================
create or replace function set_user_role(p_target_numeric_id integer, p_new_role text)
returns json language plpgsql security definer set search_path = public as $$
declare u profiles; v_target profiles; v_token uuid;
begin
  v_token := get_token_from_header();
  select * into u from auth_by_token(v_token);
  if u.id is null or u.role != 'superadmin' then
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
-- 生成邀请码（token，管理员）
-- ====================================================
create or replace function generate_invite(p_max_uses int)
returns json language plpgsql security definer set search_path = public as $$
declare u profiles; v_code text; v_token uuid;
begin
  v_token := get_token_from_header();
  select * into u from auth_by_token(v_token);
  if u.id is null or u.role not in ('admin','superadmin') then
    return json_build_object('error', '仅管理员可操作'); end if;
  v_code := 'QW' || upper(substring(md5(random()::text) from 1 for 6));
  insert into invite_codes (code, max_uses, created_by) values (v_code, p_max_uses, u.id);
  return json_build_object('code', v_code);
end; $$;

-- ====================================================
-- 高风险操作 RPC：审核预约 / 审核活动 / 推荐
-- ====================================================

-- 审核预约（token，仅管理员/发布者）
create or replace function approve_booking(p_booking_id uuid, p_action text)
returns json language plpgsql security definer set search_path = public as $$
declare u profiles; v_booking bookings; v_session activity_sessions; v_token uuid;
begin
  v_token := get_token_from_header();
  select * into u from auth_by_token(v_token);
  if u.id is null then return json_build_object('error', '请重新登录'); end if;

  select * into v_booking from bookings where id = p_booking_id;
  if v_booking is null then return json_build_object('error', '预约不存在'); end if;

  -- 防重校验（幂等性）
  if v_booking.status = 'confirmed' and p_action = 'confirm' then
    return json_build_object('error', '该预约已通过，请勿重复操作'); end if;
  if v_booking.status = 'rejected' and p_action = 'reject' then
    return json_build_object('error', '该预约已拒绝，请勿重复操作'); end if;

  select * into v_session from activity_sessions where id = v_booking.session_id for update;

  if u.role not in ('admin','superadmin')
     and not exists (select 1 from activities where id = v_session.activity_id and user_id = u.id) then
    return json_build_object('error', '无权限'); end if;

  if p_action = 'confirm' then
    -- 容量超载阻断
    if coalesce(v_session.booked_count, 0) + coalesce(v_booking.count, 1) > coalesce(v_session.capacity, 2) then
      return json_build_object('error', '期次名额不足，无法通过'); end if;

    update bookings set status = 'confirmed' where id = p_booking_id;
    update activity_sessions set booked_count = booked_count + v_booking.count where id = v_booking.session_id;
    insert into group_members (session_id, user_id)
    values (v_booking.session_id, v_booking.user_id) on conflict do nothing;
    insert into notifications (user_id, type, related_id, payload)
    values (v_booking.user_id, 'booking_confirmed', p_booking_id,
      json_build_object('activity', (select title from activities where id = v_session.activity_id)));
    return json_build_object('ok', true);
  elsif p_action = 'reject' then
    update bookings set status = 'rejected' where id = p_booking_id;
    -- 如果之前已通过，退容量+移出群
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

-- 审核活动（token，仅管理员）
create or replace function review_activity(p_activity_id uuid, p_status text, p_reason text default '')
returns json language plpgsql security definer set search_path = public as $$
declare u profiles; v_token uuid;
begin
  v_token := get_token_from_header();
  select * into u from auth_by_token(v_token);
  if u.id is null or u.role not in ('admin','superadmin') then
    return json_build_object('error', '仅管理员可操作'); end if;
  if p_status not in ('active','rejected') then
    return json_build_object('error', '状态无效'); end if;
  update activities set status = p_status, reject_reason = p_reason where id = p_activity_id;
  -- 写通知
  insert into notifications (user_id, type, related_id, payload)
  values ((select user_id from activities where id = p_activity_id),
    case when p_status = 'active' then 'activity_approved' else 'activity_rejected' end,
    p_activity_id,
    json_build_object('title', (select title from activities where id = p_activity_id), 'reason', p_reason));
  return json_build_object('ok', true);
end; $$;

-- 设置推荐位（token，仅管理员）
create or replace function set_featured(p_activity_id uuid, p_position int)
returns json language plpgsql security definer set search_path = public as $$
declare u profiles; v_token uuid;
begin
  v_token := get_token_from_header();
  select * into u from auth_by_token(v_token);
  if u.id is null or u.role not in ('admin','superadmin') then
    return json_build_object('error', '仅管理员可操作'); end if;
  if p_position is not null and p_position not in (1,2,3) then
    return json_build_object('error', '推荐位无效'); end if;
  -- 如果占位，先清除旧位
  if p_position is not null then
    update activities set featured = null where featured = p_position;
  end if;
  update activities set featured = p_position where id = p_activity_id;
  return json_build_object('ok', true);
end; $$;

-- 取消预约（token，仅本人，自动扣减容量）
create or replace function cancel_booking(p_booking_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare u profiles; v_booking bookings; v_token uuid;
begin
  v_token := get_token_from_header();
  select * into u from auth_by_token(v_token);
  if u.id is null then return json_build_object('error', '请重新登录'); end if;
  select * into v_booking from bookings where id = p_booking_id;
  if v_booking is null then return json_build_object('error', '预约不存在'); end if;
  if v_booking.user_id != u.id then return json_build_object('error', '只能取消自己的预约'); end if;
  if v_booking.status not in ('pending','confirmed') then
    return json_build_object('error', '当前状态不可取消'); end if;
  update bookings set status = 'cancelled' where id = p_booking_id;
  -- 如果之前是 confirmed，扣减名额并移出群聊
  if v_booking.status = 'confirmed' then
    update activity_sessions set booked_count = greatest(booked_count - v_booking.count, 0) where id = v_booking.session_id;
    -- 仅当该用户在此期次无其他 confirmed 预约时才移出群
    if not exists (select 1 from bookings where session_id = v_booking.session_id and user_id = u.id and status = 'confirmed' and id != p_booking_id) then
      delete from group_members where session_id = v_booking.session_id and user_id = u.id;
    end if;
  end if;
  return json_build_object('ok', true);
end; $$;

-- 切换收藏（token，防双击）
create or replace function toggle_save(p_record_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare u profiles; v_token uuid;
begin
  v_token := get_token_from_header();
  select * into u from auth_by_token(v_token);
  if u.id is null then return json_build_object('error', '请登录'); end if;
  delete from saves where user_id = u.id and record_id = p_record_id;
  if found then
    return json_build_object('ok', true, 'saved', false);
  else
    insert into saves (user_id, record_id) values (u.id, p_record_id) on conflict do nothing;
    return json_build_object('ok', true, 'saved', true);
  end if;
end; $$;

-- 切换关注（token，防双击）
create or replace function toggle_follow(p_user_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare u profiles; v_token uuid;
begin
  v_token := get_token_from_header();
  select * into u from auth_by_token(v_token);
  if u.id is null then return json_build_object('error', '请登录'); end if;
  if u.id = p_user_id then return json_build_object('error', '不可关注自己'); end if;
  delete from follows where follower_id = u.id and user_id = p_user_id;
  if found then
    return json_build_object('ok', true, 'following', false);
  else
    insert into follows (follower_id, user_id) values (u.id, p_user_id) on conflict do nothing;
    return json_build_object('ok', true, 'following', true);
  end if;
end; $$;

-- 关闭活动（发布者自己，无确认预约时可关）
create or replace function close_activity(p_activity_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare u profiles; v_token uuid;
begin
  v_token := get_token_from_header();
  select * into u from auth_by_token(v_token);
  if u.id is null then return json_build_object('error', '请登录'); end if;
  if not exists (select 1 from activities where id = p_activity_id and user_id = u.id) then
    return json_build_object('error', '只能关闭自己的活动'); end if;
  if exists (select 1 from activity_sessions s join bookings b on b.session_id = s.id
    where s.activity_id = p_activity_id and b.status = 'confirmed') then
    return json_build_object('error', '有已确认的预约，无法关闭'); end if;
  update activities set status = 'closed' where id = p_activity_id;
  return json_build_object('ok', true);
end; $$;

-- 重新上架活动（发布者自己）
create or replace function reopen_activity(p_activity_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare u profiles; v_token uuid;
begin
  v_token := get_token_from_header();
  select * into u from auth_by_token(v_token);
  if u.id is null then return json_build_object('error', '请登录'); end if;
  if not exists (select 1 from activities where id = p_activity_id and user_id = u.id) then
    return json_build_object('error', '只能操作自己的活动'); end if;
  update activities set status = 'pending_review' where id = p_activity_id and status = 'closed';
  return json_build_object('ok', true);
end; $$;

-- 取消期次（级联取消预约、清名额、解散群）
create or replace function cancel_session(p_session_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare u profiles; v_session activity_sessions; v_token uuid;
begin
  v_token := get_token_from_header();
  select * into u from auth_by_token(v_token);
  if u.id is null then return json_build_object('error', '请登录'); end if;
  select * into v_session from activity_sessions where id = p_session_id for update;
  if v_session is null then return json_build_object('error', '期次不存在'); end if;
  if not exists (select 1 from activities where id = v_session.activity_id and user_id = u.id)
     and u.role not in ('admin','superadmin') then
    return json_build_object('error', '无权限操作该期次'); end if;
  if v_session.status = 'cancelled' then return json_build_object('ok', true); end if;
  update activity_sessions set status = 'cancelled', booked_count = 0 where id = p_session_id;
  update bookings set status = 'cancelled' where session_id = p_session_id and status in ('pending','confirmed');
  delete from group_members where session_id = p_session_id;
  -- 批量通知被取消的用户
  insert into notifications (user_id, type, related_id, payload)
  select user_id, 'session_cancelled', p_session_id, json_build_object('reason', '期次已被发布者取消')
  from bookings where session_id = p_session_id and status = 'cancelled';
  return json_build_object('ok', true);
end; $$;

-- ====================================================
-- 种子数据
-- ====================================================
insert into profiles (numeric_id, nickname, password, role)
values (10000, '超级管理员', crypt('123456', gen_salt('bf')), 'superadmin')
on conflict (numeric_id) do nothing;

insert into invite_codes (code, max_uses, used_count, is_active)
values ('QWANWAN', 99, 0, true)
on conflict (code) do nothing;

-- ====================================================
-- 索引
-- ====================================================
create index if not exists idx_profiles_session_token on profiles(session_token) where session_token is not null;
create index if not exists idx_activities_status on activities(status);
create index if not exists idx_activities_featured on activities(featured);
create index if not exists idx_activities_city on activities(city);
create index if not exists idx_sessions_activity on activity_sessions(activity_id);
create index if not exists idx_bookings_user on bookings(user_id);
create index if not exists idx_bookings_session on bookings(session_id);
create index if not exists idx_notifications_user on notifications(user_id, is_read);
create index if not exists idx_group_messages_session on group_messages(session_id);
create index if not exists idx_group_members_user on group_members(user_id);
create index if not exists idx_messages_users on messages(from_user, to_user);
create index if not exists idx_records_user on records(user_id);
create index if not exists idx_activities_user_status on activities(user_id, status);

-- 活跃期次视图（排除已取消）
create or replace view active_sessions with (security_invoker = false) as
select * from activity_sessions where status is null;

-- ====================================================
-- nickname 唯一约束
-- ====================================================
alter table profiles add constraint unique_nickname unique (nickname);

-- email 部分唯一（空字符串不限制，避免登录时多行报错）
create unique index unique_email_if_not_empty on profiles (email) where email != '';

-- RLS 启用
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

-- public_profiles 视图
create or replace view public_profiles with (security_invoker = false) as
select id, numeric_id, nickname, avatar, role, bio, created_at from profiles;

-- profiles 表：前端禁止直读直写
create policy "profiles_no_direct" on profiles for all using (false) with check (false);

-- ====================================================
-- RLS 策略
-- ====================================================

-- invite_codes：可读，不可直写
create policy "invite_select" on invite_codes for select using (true);
create policy "invite_no_insert" on invite_codes for insert with check (false);
create policy "invite_no_update" on invite_codes for update using (false) with check (false);

-- messages：仅收发双方可读
create policy "msg_select" on messages for select using (
  from_user in (select id from current_user_from_header())
  or to_user in (select id from current_user_from_header())
);
create policy "msg_insert" on messages for insert with check (
  from_user = (select id from current_user_from_header())
);

-- notifications：仅本人可读，不可直写（系统 RPC 负责生成）
create policy "notif_select" on notifications for select using (
  user_id = (select id from current_user_from_header())
);
create policy "notif_insert" on notifications for insert with check (false);
create policy "notif_update" on notifications for update using (
  user_id = (select id from current_user_from_header())
);

-- group_members：管理员+发布者+群内成员可读
create policy "gm_select" on group_members for select using (
  exists (select 1 from current_user_from_header() as u where u.role in ('admin','superadmin'))
  or exists (
    select 1 from activity_sessions s join activities a on a.id = s.activity_id
    where s.id = group_members.session_id and a.user_id = (select id from current_user_from_header())
  )
  or exists (
    select 1 from bookings b
    where b.session_id = group_members.session_id and b.user_id = (select id from current_user_from_header()) and b.status = 'confirmed'
  )
);
create policy "gm_no_write" on group_members for insert with check (false);
create policy "gm_no_update" on group_members for update using (false);
create policy "gm_no_delete" on group_members for delete using (false);

-- group_messages：管理员+发布者+群内成员可读
create policy "gmsg_select" on group_messages for select using (
  exists (select 1 from current_user_from_header() as u where u.role in ('admin','superadmin'))
  or exists (
    select 1 from activity_sessions s join activities a on a.id = s.activity_id
    where s.id = group_messages.session_id and a.user_id = (select id from current_user_from_header())
  )
  or exists (
    select 1 from group_members where session_id = group_messages.session_id and user_id = (select id from current_user_from_header())
  )
);

-- group_messages：发布者+群内成员可写
create policy "gmsg_insert" on group_messages for insert with check (
  user_id = (select id from current_user_from_header())
  and (
    exists (
      select 1 from activity_sessions s join activities a on a.id = s.activity_id
      where s.id = group_messages.session_id and a.user_id = user_id
    )
    or exists (
      select 1 from group_members where session_id = group_messages.session_id and user_id = group_messages.user_id
    )
  )
);

-- activities：读开放，写仅本人+管理员
create policy "act_select" on activities for select using (true);
create policy "act_insert" on activities for insert with check (
  user_id = (select id from current_user_from_header())
  and status = 'pending_review'
  and featured is null
  and exists (select 1 from current_user_from_header() as u where u.role != 'superadmin')
);
create policy "act_update" on activities for update using (
  user_id in (select id from current_user_from_header())
  or exists (select 1 from current_user_from_header() as u where u.role in ('admin','superadmin'))
);
create policy "act_delete" on activities for delete using (
  user_id in (select id from current_user_from_header())
  and not exists (select 1 from activity_sessions s join bookings b on b.session_id = s.id where s.activity_id = activities.id and b.status = 'confirmed')
);

-- activity_sessions：读开放，写仅活动发布者
create policy "sess_select" on activity_sessions for select using (true);
create policy "sess_insert" on activity_sessions for insert with check (
  exists (select 1 from current_user_from_header() as u
    join activities a on a.id = activity_id and (a.user_id = u.id or u.role in ('admin','superadmin')))
);
create policy "sess_update" on activity_sessions for update using (
  exists (select 1 from current_user_from_header() as u
    join activities a on a.id = activity_id and (a.user_id = u.id or u.role in ('admin','superadmin')))
);
create policy "sess_delete" on activity_sessions for delete using (false);

-- bookings：读开放，写仅本人+管理员
create policy "bk_select" on bookings for select using (
  user_id = (select id from current_user_from_header())
  or exists (
    select 1 from current_user_from_header() as u
    join activity_sessions s on s.id = session_id
    join activities a on a.id = s.activity_id
    where u.role in ('admin','superadmin') or a.user_id = u.id
  )
);
create policy "bk_insert" on bookings for insert with check (
  user_id = (select id from current_user_from_header())
  and status = 'pending'
  and exists (select 1 from current_user_from_header() as u where u.role != 'superadmin')
);
create policy "bk_update" on bookings for update using (
  exists (select 1 from current_user_from_header() as u where u.role in ('admin','superadmin'))
);

-- records：读开放，写仅本人
create policy "rec_select" on records for select using (true);
create policy "rec_insert" on records for insert with check (
  user_id in (select id from current_user_from_header())
);
create policy "rec_update" on records for update using (
  user_id in (select id from current_user_from_header())
);
create policy "rec_delete" on records for delete using (
  user_id in (select id from current_user_from_header())
);

-- saves：读开放，写仅本人
create policy "save_select" on saves for select using (true);
create policy "save_insert" on saves for insert with check (
  user_id in (select id from current_user_from_header())
);
create policy "save_delete" on saves for delete using (
  user_id in (select id from current_user_from_header())
);

-- follows：读开放，写仅本人
create policy "follow_select" on follows for select using (true);
create policy "follow_insert" on follows for insert with check (
  follower_id in (select id from current_user_from_header())
);
create policy "follow_delete" on follows for delete using (
  follower_id in (select id from current_user_from_header())
);

-- ====================================================
-- 字段级安全触发器（防止普通用户篡改核心状态）
-- ====================================================

create or replace function protect_activity_status()
returns trigger language plpgsql security definer set search_path = public as $$
declare u profiles;
begin
  if current_user not in ('anon', 'authenticated') then return NEW; end if;
  select * into u from current_user_from_header();
  if u.role not in ('admin','superadmin') then
    if NEW.status != OLD.status and NEW.status != 'closed' then
      NEW.status = OLD.status;
    end if;
    NEW.reject_reason = OLD.reject_reason;
    NEW.featured = OLD.featured;
    NEW.user_id = OLD.user_id;
  end if;
  return NEW;
end; $$;

drop trigger if exists trg_protect_activity_status on activities;
create trigger trg_protect_activity_status
before update on activities for each row execute function protect_activity_status();

create or replace function protect_session_count()
returns trigger language plpgsql security definer set search_path = public as $$
declare u profiles;
begin
  if current_user not in ('anon', 'authenticated') then return NEW; end if;
  select * into u from current_user_from_header();
  if u.role not in ('admin','superadmin') then
    NEW.booked_count = OLD.booked_count;
  end if;
  return NEW;
end; $$;

drop trigger if exists trg_protect_session_count on activity_sessions;
create trigger trg_protect_session_count
before update on activity_sessions for each row execute function protect_session_count();

-- ====================================================
-- ⚠️ 待实现
-- ====================================================
-- 1. 图片上传 Supabase Storage
-- 2. 前端鉴权查询用 getSupabase()（自动带 x-app-token header）
-- 3. 上线前改超管密码（建库后立即执行 alter profiles set password=crypt('新密码', gen_salt('bf')) where numeric_id=10000）