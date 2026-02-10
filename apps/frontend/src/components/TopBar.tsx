import { Bell, ChevronDown } from "lucide-react";

export default function TopBar() {
  return (
    <div className="flex h-14 items-center justify-between border-b border-border-gray bg-white px-6">
      {/* Left: Workspace selector */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 rounded-md border border-border-gray px-3 py-1.5 cursor-pointer hover:bg-sfgray-5 transition-colors">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-darkgreen-100">
            <span className="text-[8px] font-bold text-white">P</span>
          </div>
          <span className="text-md font-medium text-text-primary">
            Planted Demo
          </span>
          <ChevronDown size={14} className="text-text-subtle" />
        </div>
      </div>

      {/* Right: Logo */}
      <div className="flex items-center gap-4">
        <button className="rounded-md p-2 hover:bg-sfgray-10 transition-colors">
          <Bell size={18} className="text-text-subtle" />
        </button>
        <img
          src="/planted-logo.svg"
          alt="Planted"
          className="h-[75px]"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      </div>
    </div>
  );
}
