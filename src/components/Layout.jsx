import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { initials } from '../lib/format.js';
import Icon from './Icon.jsx';

const NAV = {
  admin: [
    ['Operations', [['/', 'Dashboard', 'grid'], ['/work-orders', 'Work orders', 'clip']]],
    ['Assets', [['/equipment', 'Equipment register', 'cube'], ['/maintenance', 'Maintenance plan', 'cal'], ['/parts', 'Spare parts', 'pack']]],
    ['Administration', [['/users', 'User accounts', 'users'], ['/fault-categories', 'Fault categories', 'clip']]],
  ],
  head: [
    ['My department', [['/', 'Dashboard', 'grid'], ['/report', 'Report a fault', 'plus'], ['/work-orders', 'Department jobs', 'clip']]],
    ['Assets', [['/equipment', 'My equipment', 'cube'], ['/maintenance', 'Service schedule', 'cal']]],
  ],
  tech: [
    ['My work', [['/', 'My jobs', 'grid'], ['/work-orders', 'Job history', 'clip']]],
    ['Reference', [['/equipment', 'Equipment register', 'cube'], ['/maintenance', 'Maintenance plan', 'cal'], ['/parts', 'Spare parts', 'pack']]],
  ],
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);
  const [dark, setDark] = useState(false);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? 'dark' : '';
  };

  const onLogout = async () => { await logout(); navigate('/login'); };

  return (
    <div className="shell">
      <aside className="side">
        <div className="logo">
          <span className="mark"><Icon name="pulse" /></span>
          <span><b>Clinical Engineering</b><small>CMMS Portal</small></span>
        </div>
        <nav>
          {NAV[user.role].map(([group, items]) => (
            <div key={group}>
              <div className="navgrp">{group}</div>
              {items.map(([to, label, icon]) => (
                <NavLink key={to} to={to} end={to === '/'}
                  className={({ isActive }) => (isActive ? 'sel' : '')}>
                  <Icon name={icon} />{label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidefoot">v1.0 · {user.role.toUpperCase()} access</div>
      </aside>

      <div className="content">
        <header className="top">
          <div className="crumb">Portal</div>
          <button className="iconbtn" onClick={toggleTheme} aria-label="Toggle theme">
            <Icon name={dark ? 'sun' : 'moon'} />
          </button>
          <div className="umenu-wrap">
            <button className="umenu" onClick={() => setMenu((m) => !m)}>
              <span className="av">{initials(user.name)}</span>
              <b>{user.name.split(' ')[0]}</b><Icon name="chev" className="ico sm" />
            </button>
            {menu && (
              <div className="pop" onMouseLeave={() => setMenu(false)}>
                <div className="pop-head">
                  <b>{user.name}</b><small>{user.title}</small>
                </div>
                <div className="item" onClick={() => { setMenu(false); navigate('/profile'); }}>
                  <Icon name="user" className="ico sm" /> My profile
                </div>
                <div className="item danger" onClick={onLogout}>
                  <Icon name="out" className="ico sm" /> Sign out
                </div>
              </div>
            )}
          </div>
        </header>
        <main className="main"><Outlet /></main>
      </div>
    </div>
  );
}
