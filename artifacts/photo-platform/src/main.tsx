import { createRoot } from "react-dom/client";
import { setBaseUrl } from "@workspace/api-client-react";

import App from "./App";

import "./index.css";

// Point all API requests to the backend
setBaseUrl(
  import.meta.env.VITE_API_URL ??
  "https://ai-photo-vault.onrender.com"
);

createRoot(document.getElementById("root")!).render(<App />);