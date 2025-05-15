// src/utils/env.ts

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

// If you want to serve images or static files that live outside `/api`,
// you can strip the `/api` segment to get the file base URL.
const FILE_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

export { API_BASE_URL, FILE_BASE_URL };
