This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Environment Variables

Create `.env` (or copy from `.env.example`) and set the required values.

### Square Subscription

- `SQUARE_SUBSCRIPTION_PLAN_VARIATION_ID` is required to create a subscription.
	- If you see `plan_variation_id cannot be empty`, this value is missing or not being resolved.

### Square Webhook

This project can receive Square webhook events at `POST /api/payment/square/webhook` and sync the subscription status into `profiles` via `square_customer_id`.

- `SQUARE_WEBHOOK_SIGNATURE_KEY`: Square webhook signature key (for HMAC verification)
- `SQUARE_WEBHOOK_NOTIFICATION_URL`: the exact notification URL configured in Square (must match exactly, including https and trailing slash)
- `SUPABASE_SERVICE_ROLE_KEY`: required for server-side syncing in the webhook (service-role key)

### Gacha

- Production: set `GACHA_UNLIMITED` to `false` (or leave it unset).
- Note: `GACHA_UNLIMITED` is not wired in the app yet. The daily limit is enforced inside the DB function `public.spin_gacha()`.
  - Only the admin email (`okipoka.jp@gmail.com`) is exempt.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
