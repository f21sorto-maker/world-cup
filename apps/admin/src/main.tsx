import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App";
import "./admin.css";

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

const app = (
  <React.StrictMode>
    <BrowserRouter basename="/admin">
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  clerkKey ? <ClerkProvider publishableKey={clerkKey}>{app}</ClerkProvider> : app
);
