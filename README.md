# ImagineFlow

A tiny AI studio that does **Text → Image** and **Image → Text** in one delightful flow.
Built with React + Vite + Tailwind + Framer Motion on the frontend, and a small FastAPI
proxy on the backend, all powered by [Pollinations.ai](https://pollinations.ai).

## Features

- **Animated landing page** — typing-animation hero, live animated mockup, and three
  example cards that generate real images on page load.
- **Text → Image** — pick a preset or write your own prompt, choose aspect ratio, reroll
  the seed, download the result. No API key needed (uses
  `https://image.pollinations.ai`).
- **Image → Text** — drop an image, pick a caption style (detailed / alt-text / SD prompt
  / poetic), and get a caption back. Goes through the FastAPI proxy so the API key is
  never exposed to the browser.

## Project layout

```
imagine-flow/
├── frontend/   # Vite + React + TS + Tailwind + Framer Motion
└── backend/    # FastAPI proxy for Pollinations vision (image → text)
```

## Local development

You need [Node.js 20+](https://nodejs.org), [Python 3.11+](https://www.python.org), and
a Pollinations API key from <https://enter.pollinations.ai>.

### 1. Backend (FastAPI)

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -e .
cp .env.example .env
# edit .env, set POLLINATIONS_API_KEY=sk_...
export $(grep -v '^#' .env | xargs)
uvicorn app.main:app --reload --port 8000
```

Visit <http://127.0.0.1:8000/healthz> to check it's running.

### 2. Frontend (Vite)

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The dev server runs on <http://127.0.0.1:5173> and proxies `/api/*` to
`http://127.0.0.1:8000` (override with `VITE_API_PROXY`).

## Production builds

- **Frontend**: `cd frontend && npm run build` produces a static bundle in `dist/`.
- **Backend**: any ASGI host works, e.g. `uvicorn app.main:app --host 0.0.0.0 --port 8000`.

When the frontend is hosted separately from the backend, set
`VITE_API_PROXY` (dev) or rewrite `/api/*` requests on the host (prod) to point at the
backend's URL.

## How it works

- **Text → Image**: the browser hits
  `https://image.pollinations.ai/prompt/<encoded prompt>` directly. This endpoint is
  free and key-less, so it can be called from the browser.
- **Image → Text**: the browser POSTs the image as a base64 data URL to `/api/caption`.
  The FastAPI proxy adds the `Authorization: Bearer ${POLLINATIONS_API_KEY}` header and
  forwards a multimodal chat-completion request to
  `https://gen.pollinations.ai/v1/chat/completions`.

## License

MIT
