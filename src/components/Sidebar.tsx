import { useState } from "react";

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

  const toggleCategory = (name: string) => {
    setExpandedCategory((prev) => (prev === name ? null : name));
  };

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
        className={`sidebar${open ? " sidebar--open" : ""}`}
        aria-label="Main navigation"
        role="navigation"
      >
        <div className="sidebar__header">
          <span className="sidebar__title">Menu</span>
          <button
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
