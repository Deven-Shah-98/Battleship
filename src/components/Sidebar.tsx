import { useEffect, useRef, useState } from "react";

interface SidebarItem {
  label: string;
  icon: string;
  onClick: () => void;
  badge?: string;
}

interface SidebarCategory {
  name: string;
  icon: string;
  items: SidebarItem[];
}

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  categories: SidebarCategory[];
}

export default function Sidebar({ open, onClose, categories }: SidebarProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const toggleCategory = (name: string) => {
    setExpandedCategory((prev) => (prev === name ? null : name));
  };

  // Focus trap: when open, focus the close button and trap Tab within sidebar
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();

    const sidebar = sidebarRef.current;
    if (!sidebar) return;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusable = sidebar.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleTab);
    return () => document.removeEventListener("keydown", handleTab);
  }, [open]);

  return (
    <>
      {open && (
        <div
          className="sidebar-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <nav
        ref={sidebarRef}
        className={`sidebar${open ? " sidebar--open" : ""}`}
        aria-label="Main navigation"
        aria-hidden={!open}
      >
        <div className="sidebar__header">
          <span className="sidebar__title">Menu</span>
          <button
            ref={closeRef}
            type="button"
            className="sidebar__close"
            onClick={onClose}
            aria-label="Close menu"
          >
            &times;
          </button>
        </div>

        <div className="sidebar__content">
          {categories.map((cat) => (
            <div key={cat.name} className="sidebar__category">
              <button
                type="button"
                className={`sidebar__category-btn${expandedCategory === cat.name ? " sidebar__category-btn--active" : ""}`}
                onClick={() => toggleCategory(cat.name)}
                aria-expanded={expandedCategory === cat.name}
              >
                <span className="sidebar__category-icon">{cat.icon}</span>
                <span className="sidebar__category-name">{cat.name}</span>
                <span className={`sidebar__chevron${expandedCategory === cat.name ? " sidebar__chevron--open" : ""}`}>
                  &#9656;
                </span>
              </button>

              {expandedCategory === cat.name && (
                <div className="sidebar__items" role="list">
                  {cat.items.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      className="sidebar__item"
                      onClick={() => {
                        item.onClick();
                        onClose();
                      }}
                      role="listitem"
                    >
                      <span className="sidebar__item-icon">{item.icon}</span>
                      <span className="sidebar__item-label">{item.label}</span>
                      {item.badge && (
                        <span className="sidebar__item-badge">{item.badge}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </nav>
    </>
  );
}
