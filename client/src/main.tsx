import { createRoot } from "react-dom/client";
import { ThirdwebProvider } from "@thirdweb-dev/react";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";
import { queryClient } from "./lib/queryClient";

// You can use any chain here for wallet connection
const activeChain = "mumbai";

createRoot(document.getElementById("root")!).render(
  <ThirdwebProvider 
    clientId={import.meta.env.VITE_THIRDWEB_CLIENT_ID || ""}
    activeChain={activeChain}
  >
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </ThirdwebProvider>
);
