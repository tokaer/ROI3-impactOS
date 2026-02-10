import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Segment {
  label: string;
  path?: string;
}

export default function Breadcrumbs({ segments }: { segments: Segment[] }) {
  const navigate = useNavigate();

  return (
    <nav className="flex items-center gap-1 text-md text-an-60">
      {segments.map((seg, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight size={14} className="text-an-40" />}
          {seg.path ? (
            <button
              onClick={() => navigate(seg.path!)}
              className="hover:text-an-100 transition-colors"
            >
              {seg.label}
            </button>
          ) : (
            <span
              className={
                i === segments.length - 1
                  ? "font-semibold text-an-100"
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
