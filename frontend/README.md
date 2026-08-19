# Matchwise frontend

React frontend for the Spring Boot `POST /api/analyze` API supplied in the prompt.

## Run it

1. In this folder, run `npm install`.
2. Run `npm run dev`.
3. Open the address Vite prints (normally `http://localhost:5173`).

The app defaults to `http://localhost:8080/api/analyze`. To use another backend address, create a `.env` file with:

```env
VITE_API_URL=https://your-server.example/api/analyze
```

Ensure the Spring Boot backend is running and Gemini API configuration is present there.
