# MUSEUMAX

MUSEUMAX is a museum field-trip web app with separate teacher and student flows.

## Local development

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env` and fill in your Azure OpenAI values.

## Environment variables

Required:

- `AZURE_OPENAI_ENDPOINT`
- `AZURE_OPENAI_DEPLOYMENT`
- `AZURE_OPENAI_API_KEY`

Optional:

- `AZURE_OPENAI_API_VERSION`

## Deploy on Vercel

This project is prepared for Vercel deployment:

- frontend output: `dist`
- serverless APIs:
  - `/api/generate-text`
  - `/api/recognize`
- SPA rewrites for:
  - `/teacher`
  - `/student`

### Steps

1. Push the repo to GitHub.
2. Import the repo into Vercel.
3. Set the framework to `Vite` if Vercel does not detect it automatically.
4. Add the environment variables from `.env.example` in the Vercel project settings.
5. Deploy.

## Notes

- Teacher portal password is currently hardcoded in the frontend.
- Activity history is currently stored in browser local storage.
- Background texture and gallery assets should be placed under `public/bg` and `public/textures` for best visual results.
