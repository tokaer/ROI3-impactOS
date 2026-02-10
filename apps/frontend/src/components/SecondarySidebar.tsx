import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronLeft,
  FileText,
  Target,
  Link2,
  BarChart3,
  ArrowRightLeft,
  Users,
  Settings,
  TrendingUp,
  PieChart,
} from "lucide-react";

interface NavGroup {
  label: string;
  icon: React.ElementType;
  expandable: boolean;
  defaultOpen?: boolean;
  children?: { label: string; icon: React.ElementType; path: string }[];
}

const navGroups: NavGroup[] = [
  {
    label: "Doppelte Wesentlichkeit",
    icon: FileText,
    expandable: false,
  },
  {
    label: "Wertschoepfungskette",
    icon: Link2,
    expandable: false,
  },
  {
    label: "ESG Strategy Hub",
    icon: FileText,
    expandable: true,
    defaultOpen: true,
    children: [
      {
        label: "Ziele",
        icon: Target,
        path: "/strategy/esg-hub/goals",
      },
      {
        label: "KPIs",
        icon: BarChart3,
        path: "/strategy/esg-hub/kpis",
      },
      {
        label: "Aktionen",
        icon: ArrowRightLeft,
        path: "/strategy/esg-hub/actions",
      },
      {
        label: "Variablen",
        icon: TrendingUp,
        path: "/strategy/esg-hub/variables",
      },
      {
        label: "ROI Dashboard",
        icon: PieChart,
        path: "/strategy/esg-hub/roi-dashboard",
      },
      {
        label: "ROI Einstellungen",
        icon: Settings,
        path: "/strategy/esg-hub/roi-settings",
      },
    ],
  },
  {
    label: "Daily Actions",
    icon: Users,
    expandable: false,
  },
];

export default function SecondarySidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    navGroups.forEach((g) => {
      if (g.expandable) initial[g.label] = g.defaultOpen ?? false;
    });
    return initial;
  });

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <div className="flex w-[220px] flex-col bg-darkgreen-100 text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-4">
        <span className="text-md font-bold tracking-wide text-white">
          Strategie
        </span>
        <button className="rounded-full bg-white/10 p-1 hover:bg-white/20 transition-colors">
          <ChevronLeft size={14} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-auto px-2 pb-4">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-0.5">
            <button
              onClick={() =>
                group.expandable ? toggleGroup(group.label) : undefined
              }
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-md text-white/80 hover:bg-white/5 hover:text-white transition-colors"
            >
              <group.icon size={16} strokeWidth={1.5} />
              <span className="flex-1 text-left text-md">
                {group.label}
              </span>
              <ChevronDown
                size={14}
                className={`text-white/50 transition-transform ${
                  group.expandable && openGroups[group.label] ? "" : "-rotate-90"
                }`}
              />
            </button>
            {group.expandable && group.children && openGroups[group.label] && (
              <div className="ml-4 mt-0.5 space-y-0.5">
                {group.children.map((child) => {
                  const isActive = location.pathname.startsWith(child.path);
                  return (
                    <button
                      key={child.label}
                      onClick={() => navigate(child.path)}
                      className={`flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-md transition-colors ${
                        isActive
                          ? "text-lilac-100 font-medium"
                          : "text-white/60 hover:text-white/80 hover:bg-white/5"
                      }`}
                    >
                      <child.icon
                        size={14}
                        strokeWidth={1.5}
                        className={isActive ? "text-lilac-100" : ""}
                      />
                      {child.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-4 border-t border-white/10">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white">
          <span className="text-xs font-bold text-darkgreen-100">P</span>
        </div>
        <span className="text-md font-semibold tracking-wide">Planted</span>
      </div>
    </div>
  );
}
