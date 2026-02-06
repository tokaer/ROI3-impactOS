import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Segment {
  label: string;
  path?: string;
}

export default function Breadcrumbs({ segments }: { segments: Segment[] }) {
  const navigate = useNavigate();

  return (
    <nav className="flex items-center gap-1 text-sm text-text-subtle">
      {segments.map((seg, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight size={14} className="text-text-subtle/50" />}
          {seg.path ? (
            <button
              onClick={() => navigate(seg.path!)}
              className="hover:text-text-primary transition-colors"
            >
              {seg.label}
            </button>
          ) : (
            <span
              className={
                i === segments.length - 1
                  ? "font-semibold text-text-primary"
                  : ""
              }
            >
              {seg.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
