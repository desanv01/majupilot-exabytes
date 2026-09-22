begin;

-- Keep public catalogue reads independent from the authenticated-only admin
-- predicate. PostgreSQL may evaluate every permissive policy expression, so an
-- anon request must never depend on EXECUTE permission for is_catalogue_admin.
drop policy if exists catalogue_versions_read on public.catalogue_versions;
create policy catalogue_versions_public_select on public.catalogue_versions
for select to anon
using (review_state = 'active');
create policy catalogue_versions_admin_select on public.catalogue_versions
for select to authenticated
using (review_state = 'active' or app_private.is_catalogue_admin());

drop policy if exists catalogue_offerings_read on public.catalogue_offerings;
create policy catalogue_offerings_public_select on public.catalogue_offerings
for select to anon
using (
  active
  and classification <> 'unavailable/unverified'
  and exists (
    select 1
    from public.catalogue_versions version
    where version.id = catalogue_version_id
      and version.review_state = 'active'
  )
);
create policy catalogue_offerings_admin_select on public.catalogue_offerings
for select to authenticated
using (
  app_private.is_catalogue_admin()
  or (
    active
    and classification <> 'unavailable/unverified'
    and exists (
      select 1
      from public.catalogue_versions version
      where version.id = catalogue_version_id
        and version.review_state = 'active'
    )
  )
);

commit;
