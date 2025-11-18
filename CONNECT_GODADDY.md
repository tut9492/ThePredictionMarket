# How to Connect GoDaddy Domain to Vercel

## Method 1: Using Vercel Nameservers (Recommended - Easiest)

### Step 1: Get Vercel Nameservers
1. Deploy your site to Vercel first (if not done)
2. Go to your Vercel project → **Settings** → **Domains**
3. Click **"Add Domain"** and enter your GoDaddy domain (e.g., `yourdomain.com`)
4. Vercel will show you **nameservers** like:
   - `ns1.vercel-dns.com`
   - `ns2.vercel-dns.com`

### Step 2: Update Nameservers in GoDaddy
1. **Log into GoDaddy**: https://sso.godaddy.com
2. Go to **"My Products"** → Find your domain → Click **"DNS"** or **"Manage DNS"**
3. Scroll down to **"Nameservers"** section
4. Click **"Change"** or **"Edit"**
5. Select **"Custom"** (not "GoDaddy Nameservers")
6. **Delete** the existing nameservers
7. **Add** Vercel's nameservers:
   - `ns1.vercel-dns.com`
   - `ns2.vercel-dns.com`
8. Click **"Save"**

**Wait 24-48 hours** for DNS to propagate (usually faster, 1-2 hours)

---

## Method 2: Using DNS Records (Keep GoDaddy Nameservers)

If you want to keep GoDaddy's nameservers, use DNS records instead:

### Step 1: Add Domain in Vercel
1. In Vercel: **Settings** → **Domains** → **Add Domain**
2. Enter your domain: `yourdomain.com`
3. Vercel will show you DNS records to add

### Step 2: Add DNS Records in GoDaddy
1. **Log into GoDaddy**: https://sso.godaddy.com
2. Go to **"My Products"** → Your domain → **"DNS"**
3. **Add/Edit Records**:

#### For Root Domain (yourdomain.com):
- **Type**: `A`
- **Name**: `@` (or leave blank)
- **Value**: `76.76.21.21` (Vercel's IP)
- **TTL**: `600` (or default)

#### For WWW (www.yourdomain.com):
- **Type**: `CNAME`
- **Name**: `www`
- **Value**: `cname.vercel-dns.com`
- **TTL**: `600` (or default)

4. **Save** all records
5. **Delete** any conflicting A or CNAME records for `@` or `www`

### Step 3: Verify in Vercel
- Go back to Vercel → **Domains**
- Wait for status to show **"Valid Configuration"** (may take a few minutes)

---

## Troubleshooting

### Domain Not Working?
1. **Check DNS propagation**: https://dnschecker.org
2. **Wait longer**: DNS can take up to 48 hours (usually 1-2 hours)
3. **Clear browser cache**: Hard refresh (Cmd+Shift+R)
4. **Check Vercel status**: Make sure domain shows "Valid Configuration"

### Common Issues:
- **"Invalid Configuration"**: Check DNS records match exactly
- **Still showing GoDaddy page**: DNS hasn't propagated yet, wait longer
- **SSL Certificate**: Vercel automatically adds SSL (HTTPS) - wait 5-10 minutes after DNS is valid

---

## Quick Checklist

- [ ] Site deployed to Vercel
- [ ] Domain added in Vercel dashboard
- [ ] Nameservers OR DNS records updated in GoDaddy
- [ ] Waited for DNS propagation (check with dnschecker.org)
- [ ] Domain shows "Valid Configuration" in Vercel
- [ ] Site accessible at your domain

---

## Need Help?

- Vercel DNS Docs: https://vercel.com/docs/concepts/projects/domains
- GoDaddy Support: https://www.godaddy.com/help

