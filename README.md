# MIROIR

MIROIR is a full-stack AI virtual try-on demo app. Users upload a full-body photo and garment images, the backend uploads assets to Cloudinary, creates an asynchronous PiAPI Kling virtual try-on task, and the frontend polls until the generated result is ready.

## Project structure

```text
frontend/
backend/
```

## Tech stack

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express
- Upload handling: Multer
- Cloud storage: Cloudinary
- API calls: Axios
- Environment variables: dotenv

## 1. Install dependencies

Open two terminals or run each block separately:

```bash
cd backend
npm install
```

```bash
cd frontend
npm install
```

## 2. Configure environment variables

Copy the example file and fill in your real secrets:

```bash
cd backend
copy .env.example .env
```

Required values:

- `PORT`
- `PIAPI_KEY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_FOLDER` optional

Optional backend values:

- `FRONTEND_URL` default is `http://localhost:5173`

Optional frontend values:

Create `frontend/.env` if you want a custom backend URL.

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## 3. Run the backend

```bash
cd backend
npm run dev
```

Backend endpoints:

- `POST /api/tryon`
- `GET /api/tryon/:taskId`
- `GET /api/health`

## 4. Run the frontend

```bash
cd frontend
npm run dev
```

Open the Vite URL shown in the terminal, usually `http://localhost:5173`.

## End-to-end flow

1. Upload `modelImage`.
2. Choose `upper_lower` or `dress`.
3. Upload garment images based on the selected mode.
4. Click `Try On`.
5. Frontend sends `multipart/form-data` to the backend.
6. Backend uploads images to Cloudinary.
7. Backend creates a PiAPI task and returns `taskId`.
8. Frontend polls `GET /api/tryon/:taskId` every few seconds.
9. When the task completes, MIROIR shows the generated result and allows download.

## Validation rules

- `modelImage` is required.
- `dress` mode requires `dressImage`.
- `upper_lower` mode requires at least one of `upperImage` or `lowerImage`.
- `dressImage` cannot be uploaded together with `upperImage` or `lowerImage`.
- Only image files are accepted.
- Maximum upload size is 10MB per file.

## Notes

- PiAPI key is never exposed to the frontend.
- The backend is organized into controllers, services, middleware, and utilities so it is easy to extend later with MongoDB or task persistence.
- If PiAPI returns a different output shape, `backend/utils/findResultUrl.js` tries multiple patterns to find the generated image URL.
