
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./AppHeader.css";
import { useAuth } from "../auth.jsx";


function QRIcon({ size = 21 }) {
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3z" />
      <path d="M14 14h3v3h-3zM20 14v3M14 20h3M20 20h1" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14m-6-6 6 6-6 6" />
    </svg>
  );
}

function MenuIcon({ open }) {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      {open ? (
        <path d="m6 6 12 12M18 6 6 18" />
      ) : (
        <path d="M4 7h16M4 12h16M4 17h16" />
      )}
    </svg>
  );
}

function ShortcutIcon({ type }) {
  if (type === "screen") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="4" width="18" height="13" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    );
  }

  if (type === "qr") {
    return <QRIcon size={19} />;
  }

    if (type === "chart") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
    </svg>
  );
}
export function FullLogo({ variant, to = "/" }) {
  return (
    <div className={`app-header-${variant}`}>
      <Link to={to} className="app-header-brand" aria-label="LineUp home">
        <span className="app-header-brand-icon">
          <QRIcon />
        </span>

        <span className="app-header-wordmark">
          LineUp<span className="app-header-period">.</span>
        </span>
      </Link>
        </div>
    )
}
export default function AppHeader({
  variant = "hero",
  showAction = true,
  showMenu = false,
  menuItems = [],
  type='full'
}) {
    const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const { pathname } = useLocation();

  useEffect(() => {
    if (!menuOpen) return undefined;

    function handlePointerDown(event) {
      if (!menuRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  return (
    <header className={`app-header app-header-${variant}`}>
            <FullLogo to={user ? "/shops" : "/"} />
  
        
      <div className="app-header-right">
        {showMenu && menuItems.length > 0 && (
          <>
            {/* Desktop: show shortcuts directly in the header. */}
            <nav
              className="app-header-desktop-nav"
              aria-label="Shop shortcuts"
            >
              {menuItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className="app-header-desktop-link"
                  target={item.external ? "_blank" : undefined}
                  rel={item.external ? "noreferrer" : undefined}
                >
                  <span className="app-header-desktop-icon">
                    <ShortcutIcon type={item.icon} />
                  </span>

                  <span>{item.label}</span>

                  {item.external && (
                    <span
                      className="app-header-external"
                      aria-label="Opens in a new tab"
                    >
                      ↗
                    </span>
                  )}
                </Link>
              ))}
            </nav>

            {/* Mobile: keep shortcuts inside the hamburger menu. */}
            <div className="app-header-menu-wrap" ref={menuRef}>
              <button
                type="button"
                className="app-header-menu-button"
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                onClick={() => setMenuOpen((open) => !open)}
              >
                <MenuIcon open={menuOpen} />
              </button>

              {menuOpen && (
                <nav
                  className="app-header-dropdown"
                  aria-label="Shop menu"
                  role="menu"
                >
                  <p className="app-header-dropdown-label">
                    Shop shortcuts
                  </p>

                  {menuItems.map((item) => (
                    <Link
                      key={item.label}
                      to={item.to}
                      className="app-header-dropdown-link"
                      role="menuitem"
                      target={item.external ? "_blank" : undefined}
                      rel={item.external ? "noreferrer" : undefined}
                      onClick={() => setMenuOpen(false)}
                    >
                      <span className="app-header-dropdown-icon">
                        <ShortcutIcon type={item.icon} />
                      </span>

                      <span>{item.label}</span>

                      {item.external && (
                        <span
                          className="app-header-external"
                          aria-label="Opens in a new tab"
                        >
                          ↗
                        </span>
                      )}
                    </Link>
                  ))}
                </nav>
              )}
            </div>
          </>
        )}

                {showAction &&
          (user ? (
            <>
                            {pathname !== "/shops" && (
                <Link to="/shops" className="app-header-action">
                  <span>My shops</span>
                  <ArrowIcon />
                </Link>
              )}
              <button
                type="button"
                className="app-header-action"
                onClick={() => {
                  logout();
                  navigate("/");
                }}
              >
                <span>Log out</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="app-header-action">
                <span>Log in</span>
              </Link>
              <Link to="/signup" className="app-header-action">
                <span>Sign up</span>
                <ArrowIcon />
              </Link>
            </>
          ))}
      </div>
      
    </header>
  );
}
