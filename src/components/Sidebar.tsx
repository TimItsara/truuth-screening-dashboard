import { type AppView, viewLabels, visibleViews } from "./viewTypes";

interface SidebarProps {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  return (
    <aside className="sidebar">
      <nav>
        {visibleViews.map((item) => (
          <button
            key={item}
            className={`nav-item ${item === activeView ? "active" : ""}`}
            type="button"
            onClick={() => onViewChange(item)}
          >
            {viewLabels[item]}
          </button>
        ))}
      </nav>
    </aside>
  );
}
