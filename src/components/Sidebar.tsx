import { type AppView, viewLabels } from "./viewTypes";

const items: AppView[] = ["home", "subjects", "review", "pep", "reports", "providers"];

interface SidebarProps {
  activeView: AppView;
  onViewChange: (view: AppView) => void;
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  return (
    <aside className="sidebar">
      <nav>
        {items.map((item) => (
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
