-- Lenders and insurers see the applications, policies and claims addressed to them.
alter table public.loan_applications add column if not exists lender_id uuid references public.profiles (id) on delete set null;
alter table public.insurance_policies add column if not exists insurer_id uuid references public.profiles (id) on delete set null;
create index if not exists loan_applications_lender_idx on public.loan_applications (lender_id, status);
create index if not exists insurance_policies_insurer_idx on public.insurance_policies (insurer_id, status);

create policy loan_applications_lender_view on public.loan_applications for select to authenticated
  using (lender_id = (select auth.uid()));
create policy loan_applications_lender_decide on public.loan_applications for update to authenticated
  using (lender_id = (select auth.uid())) with check (lender_id = (select auth.uid()));
create policy insurance_policies_insurer_view on public.insurance_policies for select to authenticated
  using (insurer_id = (select auth.uid()));
create policy insurance_claims_insurer_view on public.insurance_claims for select to authenticated
  using (exists (select 1 from public.insurance_policies p where p.id = policy_id and p.insurer_id = (select auth.uid())));
create policy insurance_claims_insurer_decide on public.insurance_claims for update to authenticated
  using (exists (select 1 from public.insurance_policies p where p.id = policy_id and p.insurer_id = (select auth.uid())))
  with check (exists (select 1 from public.insurance_policies p where p.id = policy_id and p.insurer_id = (select auth.uid())));
