import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './DashboardTopBar.css';

const buttons = [
  { label: '+ Add Transaction', path: '/transactions/new', variant: 'primary' },
  { label: '+ Add Income', path: '/transactions/new?type=INCOME', variant: 'primary' },
  { label: 'View Transactions', path: '/transactions', variant: 'ghost' },
  { label: 'Create Budget', path: '/budgets', variant: 'ghost' },
  { label: 'Add Recurring Bill', path: '/recurring', variant: 'ghost' },
  { label: 'Update Goal Contribution', path: '/goals', variant: 'ghost' },
];

export default function DashboardTopBar() {
  const [isCompact, setIsCompact] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const evaluate = () => setIsCompact(window.innerWidth < 960);
    evaluate();
    window.addEventListener('resize', evaluate);
    return () => window.removeEventListener('resize', evaluate);
  }, []);

  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const visibleButtons = useMemo(
    () => (isCompact ? buttons.filter((button) => button.variant === 'primary') : buttons),
    [isCompact]
  );
  const overflowButtons = useMemo(
    () => (isCompact ? buttons.filter((button) => button.variant !== 'primary') : []),
    [isCompact]
  );

  useEffect(() => {
    if (!isCompact) {
      setMenuOpen(false);
    }
  }, [isCompact]);

  const renderedButtons = useMemo(
    () =>
      visibleButtons.map((button) => (
        <button
          key={button.label}
          type="button"
          className={`dashboard-action-btn ${button.variant === 'primary' ? 'primary' : 'ghost'}`}
          onClick={() => navigate(button.path)}
        >
          {button.label}
        </button>
      )),
    [navigate, visibleButtons]
  );

  return (
    <div className="dashboard-topbar">
      <div className="dashboard-topbar-actions" role="toolbar" aria-label="Dashboard actions">
        {renderedButtons}
        {overflowButtons.length > 0 && (
          <div ref={menuRef} className="dashboard-more-actions">
            <button
              type="button"
              className="dashboard-action-btn ghost more-toggle"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              More actions
            </button>
            {menuOpen && (
              <div className="dashboard-more-menu" role="menu">
                {overflowButtons.map((button) => (
                  <button
                    key={button.label}
                    type="button"
                    className="dashboard-action-btn ghost overflow"
                    role="menuitem"
                    onClick={() => {
                      navigate(button.path);
                      setMenuOpen(false);
                    }}
                  >
                    {button.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
