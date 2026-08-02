import { createRoot } from "react-dom/client";
import { setBaseUrl } from "@workspace/api-client-react";

import App from "./App";

import "./index.css";

// Point all API requests to the backend
setBaseUrl("http://localhost:5001");

createRoot(document.getElementById("root")!).render(<App />);