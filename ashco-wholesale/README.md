# Ashco Wholesale

A wholesale ordering site: customers browse stock, add items to a cart, and submit a UK
delivery address. An invoice PDF is generated automatically and emailed to the customer and
to you. No payment is taken on the site — you contact the customer to confirm and arrange
payment yourself, as agreed.

You manage products (add/edit/delete, mark in/out of stock) through a password-protected
`/admin` dashboard, and see every order that comes in under `/admin/orders`.

---

## 1. What you need before you start

Three free accounts:

1. **Supabase** — https://supabase.com — the database and admin login
2. **Resend** — https://resend.com — sends the invoice emails
3. **Vercel** — https://vercel.com — hosts the live site
4. **GitHub** — https://github.com — holds the code so Vercel can deploy it

All four have generous free tiers that comfortably cover a store like this.

---

## 2. Set up Supabase

1. Go to https://supabase.com → **New project**. Pick any name/region, set a database password
   (save it somewhere), and wait ~2 minutes for it to spin up.
2. In the left sidebar go to **SQL Editor** → **New query**. Open the file
   `supabase/schema.sql` from this project, paste its entire contents in, and click **Run**.
   This creates the products/orders tables and the security rules that keep your data safe.
3. Go to **Settings → API**. You'll need three values from this page in step 4 below:
   - **Project URL**
   - **anon public** key
   - **service_role** key (click "Reveal" — keep this one secret, never put it in a browser)
4. Create your admin login: go to **Authentication → Users → Add user**, enter your email and
   a password. This is what you'll use to sign in at `/admin` — there's no separate signup
   page, it's just for you.

---

## 3. Set up Resend (for sending invoice emails)

1. Sign up at https://resend.com and verify your account.
2. Go to **API Keys → Create API Key**, name it anything, copy the key (starts with `re_`).
3. To start, you can send from Resend's shared test address (`onboarding@resend.dev`) — this
   works immediately but Gmail/Outlook may occasionally flag it as unfamiliar. When you're
   ready to send from your own address (e.g. `orders@ashcowholesale.co.uk`), go to
   **Domains → Add Domain** in Resend and follow their DNS instructions — this needs you to
   own a domain name. Until then, leave `STORE_FROM_EMAIL` as the default in `.env.example`.

---

## 4. Configure environment variables

In this project, copy `.env.example` to a new file called `.env.local` and fill in the real
values from steps 2 and 3:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
RESEND_API_KEY=...
STORE_FROM_EMAIL=Ashco Wholesale <onboarding@resend.dev>
STORE_NOTIFICATION_EMAIL=ashcowholesale@gmail.com
```

`.env.local` is already in `.gitignore` so it never gets pushed to GitHub.

---

## 5. Run it locally (optional, to check everything before going live)

```bash
npm install
npm run dev
```

Open http://localhost:3000 — you should see the (empty) storefront. Go to
http://localhost:3000/admin/login and sign in with the user you created in step 2.4, then add
a product or two to see them appear on the storefront.

---

## 6. Put the code on GitHub

```bash
git init
git add .
git commit -m "Ashco Wholesale"
```

Create a new empty repository on GitHub, then follow the "push an existing repository" 
instructions it shows you (roughly: `git remote add origin <your-repo-url>`, then 
`git push -u origin main`).

---

## 7. Deploy on Vercel

1. Go to https://vercel.com → **Add New → Project** → import the GitHub repo you just pushed.
2. Before clicking Deploy, open **Environment Variables** and add the same six values from
   your `.env.local` file.
3. Click **Deploy**. After a minute or two you'll get a live URL
   (e.g. `ashco-wholesale.vercel.app`).
4. Once it's live, go to `/admin/login` on that URL, sign in, and add your real products —
   the placeholders (if you added any locally) can be deleted from there too.

If you buy a custom domain later (e.g. `ashcowholesale.co.uk`), you can attach it under
**Vercel → Project → Settings → Domains**.

---

## How things work day to day

- **Adding stock**: `/admin` → fill in the form on the left (name, description, price, photo)
  → Add product. Toggle "In stock" off for anything temporarily unavailable — it'll show as
  unavailable to customers but stay in your list.
- **New orders**: the moment a customer checks out, you'll get an email at
  `ashcowholesale@gmail.com` with the order details and the invoice PDF attached. It's also
  saved in `/admin/orders` so nothing gets lost even if an email bounces.
- **Prices**: always entered/displayed in pounds, stored internally as pence to avoid rounding
  issues — you don't need to think about this, just type `12.50` etc.
- **Money isn't charged on the site.** Placing an order only creates the invoice and sends the
  emails — no card details are collected. Take payment however you currently do once you've
  spoken to the customer.

## Project structure

```
src/app/               storefront, cart, checkout, admin pages
src/app/api/checkout   creates the order, builds the invoice PDF, sends both emails
src/app/api/admin      product create/update/delete (used by the admin dashboard)
src/lib/pdf.ts         invoice PDF layout
src/lib/email.ts       email templates sent via Resend
src/lib/supabase/      three Supabase clients (browser, server, and admin/service-role)
supabase/schema.sql    run once in Supabase's SQL editor to set up your database
```
