import Sidebar from "@/clearwave/components/layout/Sidebar";
import Home from "@/clearwave/pages/Home";
import BackgroundEffects from "@/clearwave/components/layout/BackgorundEffects";
import { Toaster } from "sonner";
import "./index.css";

export default function App() {
  return (
    <div className="min-h-screen flex relative overflow-hidden">
      <BackgroundEffects />

      <div className="relative z-10 flex w-full">
        <Sidebar />
        <Home />
      </div>

      <Toaster
        richColors
        position="top-right"
        theme="dark"
        toastOptions={{
          className:
            "!z-[99999]",
        }}
      />
    </div>
  );
}
