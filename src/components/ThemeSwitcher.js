import { useEffect, useRef, useState } from "react";
import { FiCheck, FiChevronDown, FiSliders } from "react-icons/fi";
import { THEME_OPTIONS, applyTheme, getSavedTheme } from "../utils/themes";

function ThemeSwitcher() {
  const [open, setOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState(() => getSavedTheme());
  const wrapperRef = useRef(null);

  useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const chooseTheme = (themeId) => {
    setCurrentTheme(themeId);
    setOpen(false);
  };

  return (
    <div className="theme-switcher" ref={wrapperRef}>
      <button
        type="button"
        className="theme-trigger"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span className="theme-trigger-icon" aria-hidden="true"><FiSliders /></span>
        <span className="theme-trigger-label">Themes</span>
        <span className="theme-trigger-arrow" aria-hidden="true"><FiChevronDown /></span>
      </button>

      {open ? (
        <div className="theme-popover" role="dialog" aria-label="Choose color theme">
          <h4>Choose your theme</h4>
          <p>One click instantly updates your full Wellify experience.</p>
          <div className="theme-grid">
            {THEME_OPTIONS.map((theme) => {
              const selected = theme.id === currentTheme;

              return (
                <button
                  key={theme.id}
                  type="button"
                  className={`theme-card${selected ? " selected" : ""}`}
                  onClick={() => chooseTheme(theme.id)}
                >
                  <span className={`theme-preview ${theme.id}`} />
                  <span className="theme-meta">
                    <strong>{theme.name}</strong>
                    <small>{theme.subtitle}</small>
                  </span>
                  {selected ? (
                    <span className="theme-selected-icon" aria-hidden="true"><FiCheck /></span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default ThemeSwitcher;
