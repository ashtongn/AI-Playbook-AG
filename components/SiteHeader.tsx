"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, Search, X } from "lucide-react";
import { PRODUCT_NAME } from "@/lib/branding";
import { FEATURES } from "@/lib/features";
import { PRIMARY_NAVIGATION } from "@/lib/navigation";
import { openPlatformAccount, usePlatformIdentity } from "@/lib/platformIdentity";

export default function SiteHeader() {
  const pathname = usePathname();
  const identity = usePlatformIdentity();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const header = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !header.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    const desktop = window.matchMedia("(min-width: 70rem)");
    const onResize = () => {
      if (desktop.matches) setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    desktop.addEventListener("change", onResize);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
      desktop.removeEventListener("change", onResize);
    };
  }, [menuOpen]);

  return (
    <header ref={header} className="site-header">
      <div className="site-notice">
        <div className="site-container">
          <span>Concept demonstration</span>
          <p>Plays are examples — check every draft before you sign it.</p>
        </div>
      </div>
      <div className="site-container site-masthead">
        <Link href="/" className="site-brand" aria-label={`${PRODUCT_NAME} home`} onClick={() => setMenuOpen(false)}>
          <span className="site-brand-mark" aria-hidden="true">AP</span>
          <span>Airman&apos;s <strong>AI Playbook</strong></span>
        </Link>
        <button
          ref={menuButton}
          type="button"
          className="site-menu-toggle"
          aria-expanded={menuOpen}
          aria-controls="site-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? "Close" : "Menu"}
          {menuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
        </button>
        <nav id="site-navigation" className={`site-navigation${menuOpen ? " is-open" : ""}`} aria-label="Main navigation">
          {PRIMARY_NAVIGATION.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                onClick={() => setMenuOpen(false)}
              >
                {label === "Search" && <Search size={16} aria-hidden="true" />}
                {label}
              </Link>
            );
          })}
          {FEATURES.auth && (
            <button type="button" className="site-account" onClick={() => { setMenuOpen(false); openPlatformAccount(); }}>
              {identity ? "Account" : "Simulated sign-in"}
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
