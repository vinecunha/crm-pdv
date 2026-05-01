-- Trigger para tornar primeiro usuário admin automaticamente

create or replace function public.handle_new_user_admin()
returns trigger as $$
declare
  user_count integer;
begin
  select count(*) into user_count from public.profiles;
  
  if user_count = 0 then
    new.role = 'admin';
  end if;
  
  return new;
end;
$$ language plpgsql security definer set search_path = '';

-- Remover trigger existente se houver
drop trigger if exists trg_auto_admin_first_user on public.profiles;

-- Criar novo trigger
create trigger trg_auto_admin_first_user
  before insert on public.profiles
  for each row
  execute function public.handle_new_user_admin();
