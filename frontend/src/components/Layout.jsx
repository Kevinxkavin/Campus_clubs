import { useState, useCallback } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, BookOpen, CalendarDays, PlusCircle,
  Shield, User, LogOut, Briefcase, Sun, Moon
} from 'lucide-react';

// ── Initialise theme before first render (avoids flash) ──────────────────────
const initTheme = () => {
  const saved = localStorage.getItem('cc_theme') || 'dark';
  if (saved === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  return saved;
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const [theme, setTheme] = useState(initTheme);


  /* Apply theme to <html> and persist */
  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      if (next === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
      localStorage.setItem('cc_theme', next);
      return next;
    });
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };
  const roleLabel = {
    student:     'Student',
    coordinator: 'Club Coordinator',
    advisor:     'Faculty Advisor',
    admin:       'Administrator',
  };

  const isDark = theme === 'dark';

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-text">CampusClubs</div>
          <div className="logo-sub">Academic Clubs Platform</div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Main</div>
          <NavLink to="/" end className={({isActive}) => `nav-item${isActive?' active':''}`}>
            <LayoutDashboard/> Feed
          </NavLink>
          <NavLink to="/clubs" className={({isActive}) => `nav-item${isActive?' active':''}`}>
            <BookOpen/> Clubs
          </NavLink>

          <div className="nav-section-label">Events</div>
          <NavLink to="/my-events"    className={({isActive}) => `nav-item${isActive?' active':''}`}>
            <CalendarDays/> My Events
          </NavLink>
          <NavLink to="/create-event" className={({isActive}) => `nav-item${isActive?' active':''}`}>
            <PlusCircle/> Create Event
          </NavLink>

          {user?.role === 'coordinator' && <>
            <div className="nav-section-label">Coordinator</div>
            <NavLink to="/coordinator" className={({isActive}) => `nav-item${isActive?' active':''}`}>
              <Briefcase/> Approval Queue
            </NavLink>
          </>}

          {user?.role === 'admin' && <>
            <div className="nav-section-label">Administration</div>
            <NavLink to="/admin" className={({isActive}) => `nav-item${isActive?' active':''}`}>
              <Shield/> Admin Panel
            </NavLink>
          </>}

          <div className="nav-section-label">Account</div>
          <NavLink to="/profile" className={({isActive}) => `nav-item${isActive?' active':''}`}>
            <User/> Profile
          </NavLink>
        </nav>

        <div className="sidebar-user">
          {/* ── Theme Toggle ─────────────────────────────────────── */}
          <button className="theme-toggle-btn" onClick={toggleTheme} title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
            <span className="theme-icon">
              {isDark
                ? <Sun  size={15} style={{ color: '#fbbf24' }} />
                : <Moon size={15} style={{ color: '#6d28d9' }} />
              }
            </span>
            <span className="theme-label">
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </span>
            <span className="theme-badge">
              {isDark ? 'Light' : 'Dark'}
            </span>
          </button>

          {/* ── User Card ────────────────────────────────────────── */}
          <div className="user-card">
            {user?.avatar
              ? <img src={user.avatar} alt={user.name} style={{ width:36, height:36, borderRadius:'50%', objectFit:'cover', flexShrink:0 }}/>
              : <div className="user-avatar" style={{ width:36, height:36, fontSize:14 }}>{user?.name?.charAt(0).toUpperCase()}</div>
            }
            <div className="user-info" style={{ flex:1, minWidth:0 }}>
              <div className="user-name" style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name}</div>
              <div className="user-role">{roleLabel[user?.role]}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout} style={{ marginTop:8, paddingLeft:4 }}>
            <LogOut size={14}/> Sign out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet/>
      </main>
    </div>
  );
}
