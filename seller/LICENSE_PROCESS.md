# Caption Generator Pro — Seller License Fulfillment Process

This guide documents the manual, reliable workflow for issuing, managing, and troubleshooting customer license keys using your Supabase backend.

---

## 📋 Standard Sales & Fulfillment Workflow

### Step 1: Customer Purchases License
When a customer purchases a copy of Caption Generator Pro (via Gumroad, Stripe, Lemon Squeezy, or direct order):
- Note their **Email Address**, **Order ID**, and **License Type** (1-Machine or 2-Machine).

### Step 2: Generate a License Key
Generate a unique license key using the standard format:
`CGP-XXXX-XXXX-XXXX` (e.g., `CGP-8842-K9L1-M3P4`).

*Tip: You can generate random keys via PowerShell:*
```powershell
"CGP-" + (-join ((65..90) + (48..57) | Get-Random -Count 12 | % {[char]$_}))
```

### Step 3: Insert Key into Supabase
1. Open your **Supabase Dashboard** -> **SQL Editor**.
2. Run Template #1 or #2 from `seller/create-license.sql`:
   ```sql
   INSERT INTO public.licenses (license_key, max_activations, is_active, notes)
   VALUES ('CGP-8842-K9L1-M3P4', 1, true, 'Customer: buyer@example.com - Order #1042');
   ```

### Step 4: Deliver License to Customer
Send an email to the buyer containing:
1. Their **License Key**: `CGP-8842-K9L1-M3P4`
2. The customer release ZIP package (containing `install.bat`, `SETUP_GUIDE.txt`).

---

## 🛠️ Customer Support & Machine Transfers

### Scenario A: Customer Replaced PC or Needs Re-activation
If a customer formatted their computer, upgraded hardware, or bought a new PC:
1. Open Supabase SQL Editor.
2. Run Template #6 from `seller/create-license.sql`:
   ```sql
   DELETE FROM public.activations
   WHERE license_id = (SELECT id FROM public.licenses WHERE license_key = 'CGP-8842-K9L1-M3P4');
   ```
3. Ask the customer to click **Activate License** in the Settings tab again.

### Scenario B: Revoking a Refunded / Chargeback License
If a customer requests a refund or initiates a chargeback:
1. Run Template #3 from `seller/create-license.sql`:
   ```sql
   UPDATE public.licenses
   SET is_active = false
   WHERE license_key = 'CGP-8842-K9L1-M3P4';
   ```
2. The plugin will immediately block feature access (Transcription, Subtitle Creation, SRT Export) next time validation runs.
