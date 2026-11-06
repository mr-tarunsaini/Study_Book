import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileTopBar } from './MobileTopBar';
import { Footer } from './Footer';
import { resourceService } from '../../services/resourceService';

export const Layout: React.FC = () => {
  const [expanded, setExpanded] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const location = useLocation();

  const isViewer = location.pathname.startsWith('/notes/') || location.pathname.startsWith('/viewer');

  useEffect(() => {
    if (expanded && !isViewer) {
      document.body.classList.add('sidebar-expanded');
    } else {
      document.body.classList.remove('sidebar-expanded');
    }

    if (isViewer) {
      document.body.classList.add('viewer-mode');
    } else {
      document.body.classList.remove('viewer-mode');
    }
  }, [expanded, isViewer]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Automated background cleanup: removes PDFs & database records older than 100 days
  useEffect(() => {
    const runAutoCleanup = async () => {
      try {
        const lastRun = localStorage.getItem('studybook_last_auto_cleanup');
        const now = Date.now();
        // Check once every 24 hours (86,400,000 ms)
        if (!lastRun || now - Number(lastRun) > 24 * 60 * 60 * 1000) {
          const res = await resourceService.cleanupExpiredMaterials(100);
          localStorage.setItem('studybook_last_auto_cleanup', now.toString());
          if (res.deleted > 0) {
            console.log(
              `[Auto-Cleanup] Successfully removed ${res.deleted} expired document(s) & PDF file(s) older than 100 days.`
            );
          }
        }
      } catch (err) {
        console.warn('[Auto-Cleanup Background Task]', err);
      }
    };

    runAutoCleanup();
  }, []);

  const toggleExpand = () => setExpanded((prev) => !prev);
  const openMobile = () => setMobileOpen(true);
  const closeMobile = () => setMobileOpen(false);

  if (isViewer) {
    return <Outlet />;
  }

  return (
    <>
      <MobileTopBar onOpenMobile={openMobile} />
      <Sidebar
        expanded={expanded}
        onToggleExpand={toggleExpand}
        mobileOpen={mobileOpen}
        onCloseMobile={closeMobile}
      />
      <main className="container">
        <Outlet />
      </main>
      <Footer />
    </>
  );
};
