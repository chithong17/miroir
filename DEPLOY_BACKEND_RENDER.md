# Deploy MIROIR Backend On Render

## 1. Push code to GitHub

Make sure these files are committed:

- `backend/package.json`
- `backend/package-lock.json`
- `backend/server.js`
- `render.yaml`
- `backend/.env.example`

Do not commit `backend/.env`.

## 2. Create the Render service

In Render:

1. New > Web Service.
2. Connect the GitHub repository.
3. If using the dashboard manually:
   - Root Directory: `backend`
   - Build Command: `npm ci`
   - Start Command: `npm start`
   - Health Check Path: `/api/health`

The root `render.yaml` also contains the same service configuration.

## 3. Add environment variables

Copy values from `backend/.env` into Render Environment, except `PORT`.
Render provides `PORT` automatically.

Required:

- `FRONTEND_URL`
- `PIAPI_KEY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_FOLDER`
- `MONGODB_URI`
- `MONGODB_DB_NAME`
- `GEMINI_API_KEY`
- `GEMINI_EMBEDDING_MODEL`
- `GEMINI_GENERATION_MODEL`
- `MONGODB_PRODUCT_VECTOR_INDEX`
- `MONGODB_OUTFIT_VECTOR_INDEX`
- `MONGODB_FASHION_RULE_VECTOR_INDEX`
- `JWT_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_NAME`

## 4. MongoDB Atlas network access

Allow Render to connect to MongoDB Atlas. During MVP testing, the simple option is to allow `0.0.0.0/0` in Atlas Network Access. For production, restrict this later.

## 5. Seed admin

If the deployed database does not already have the admin user, run:

```bash
npm run seed:admin
```

Use Render Shell if available, or run it locally with the production `MONGODB_URI`.

## 6. Verify

Open:

```text
https://YOUR_RENDER_SERVICE.onrender.com/api/health
```

Expected:

```json
{"success":true,"message":"MIROIR backend is running"}
```

## 7. Connect frontend

Set frontend env:

```text
VITE_API_BASE_URL=https://YOUR_RENDER_SERVICE.onrender.com/api
```

Then rebuild/redeploy frontend.
