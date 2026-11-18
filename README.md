# Developer Aziz
Responsive black/red developer portfolio with Supabase Auth, PostgreSQL, Row Level Security and an admin workspace.

## Setup
1. Create a Supabase project.
2. In Supabase SQL Editor, run `supabase/schema.sql`.
3. In Supabase Authentication > Users, create your administrator user (use a strong unique password).
4. Copy the user's UUID and run this SQL in the SQL Editor:
   `insert into public.user_roles(user_id,role) values('YOUR_USER_UUID','admin');`
5. Copy the project URL and anon/publishable key from Supabase Project Settings > API.
6. Put them in `assets/js/config.js`. Only the anon/publishable key belongs in browser code. Never expose service_role or secret keys.
7. Commit and push to GitHub. Enable GitHub Pages from main / root.

## Security notes
- RLS protects profile updates, project management and message inbox access.
- Public visitors can only read portfolio content and submit contact messages.
- Admin authorization is checked against the protected user_roles table.
- Use a strong password and enable MFA in Supabase.
- Configure Auth URL allow-list for your deployed GitHub Pages URL.
- Add CAPTCHA / rate limiting for the public contact form before relying on it in production.
- Static hosting + Supabase is a serverless architecture; no privileged secret is stored in the browser.
