import {
  Home,
  Target,
  FileText,
  Globe,
  HelpCircle,
  Settings,
} from "lucide-react";
import { useLocation } from "react-router-dom";

const topItems = [
  { icon: Home, label: "Start", path: "/" },
  { icon: Target, label: "Strategie", path: "/strategy" },
  { icon: FileText, label: "Berichte", path: "/berichte" },
  { icon: Globe, label: "Impact", path: "/impact" },
];

export default function PrimarySidebar() {
  const location = useLocation();

  return (
    <div className="flex w-[68px] flex-col items-center justify-between bg-darkgreen-100 py-4 shrink-0">
      <div className="flex flex-col items-center gap-1">
        {topItems.map((item) => {
          const active = location.pathname.startsWith(item.path) && item.path !== "/"
            || (item.path === "/" && location.pathname === "/");
          const isStrategie = item.label === "Strategie";
          const isActive = isStrategie
            ? location.pathname.startsWith("/strategy")
            : active;

          return (
            <div
              key={item.label}
              className={`flex w-14 flex-col items-center gap-1 rounded-md py-2 cursor-pointer transition-colors ${
                isActive
                  ? "bg-darkgreen-75 text-white"
                  : "text-white/60 hover:text-white/80"
              }`}
            >
              <item.icon size={20} strokeWidth={1.5} />
              <span className="text-xs font-medium">{item.label}</span>
            </div>
          );
        })}
      </div>
      <div className="flex flex-col items-center gap-1">
        <div className="flex w-14 flex-col items-center gap-1 rounded-md py-2 cursor-pointer text-white/60 hover:text-white/80 transition-colors">
          <HelpCircle size={20} strokeWidth={1.5} />
        </div>
        <div className="flex w-14 flex-col items-center gap-1 rounded-md py-2 cursor-pointer text-white/60 hover:text-white/80 transition-colors">
          <Settings size={20} strokeWidth={1.5} />
        </div>
      </div>
    </div>
  );
}
