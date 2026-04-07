## SmartAgri MVP

SmartAgri is a farmer-first Next.js application that combines advisory, scan workflows, irrigation planning, soil analysis, marketplace flows, and multilingual assistant features.

## Local Development

Install dependencies and start the app:

```bash
npm install
npm run dev
```

To verify the production bundle locally:

```bash
npm run build
```

## Vercel Deployment

1. Import the repository into Vercel as a Next.js project.
2. Add the environment variables from `.env.example` in the Vercel project settings.
3. Keep the build command as `npm run build`.
4. Redeploy after every environment-variable change.

The app now includes a built-in soil recommendation fallback, so `ML_SERVER_URL` is optional on Vercel. If you provide `ML_SERVER_URL`, SmartAgri will call your external ML service first and fall back automatically if it is unavailable.

## Environment Variables

Required for database-backed features:
- `MONGODB_URI`

Required for scan uploads:
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Required for email/contact flows:
- `ALERT_EMAIL_FROM`
- `ALERT_EMAIL_APP_PASSWORD`

Optional integrations:
- `ML_SERVER_URL`
- `OPENAI_API_KEY`
- `GEMINI_API_KEY` or `GOOGLE_GEMINI_API_KEY`
- `SARVAM_API_KEY`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER`
- `IMD_FORECAST_URL`
- `IMD_API_KEY`

## Notes

- TypeScript passes for the production build.
- Google-font fetching has been removed from the app shell so builds do not depend on external font downloads.
- Secrets should be configured in Vercel Project Settings, not committed to the repo.
