import { useEffect, useMemo, useState } from 'react';
import { NavLink, Route, Routes, useLocation } from 'react-router-dom';
import TrainPage from './pages/TrainPage.jsx';
import GeneratePage from './pages/GeneratePage.jsx';
import EvaluatePage from './pages/EvaluatePage.jsx';
import EvaluationDashboardPage from './pages/EvaluationDashboardPage.jsx';
import MergePage from './pages/MergePage.jsx';
import JobsPage from './pages/JobsPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import { API_BASE_URL } from './utils/api.js';

const NAV_LINKS = [
  { to: '/', label: 'Home', helper: 'Overview & quick start', end: true },
  { to: '/train', label: 'Fine-tune', helper: 'Upload data & launch training' },
  { to: '/generate', label: 'Try the model', helper: 'Craft a prompt & test output' },
  {
    to: '/evaluate',
    label: 'Evaluate',
    helper: 'Measure accuracy against answers',
    children: [
      { to: '/evaluate', label: 'Evaluation runs', helper: 'Queue scoring jobs' },
      { to: '/evaluate/dashboard', label: 'Evaluation dashboard', helper: 'Visualise scoring data' }
    ]
  },
  { to: '/merge', label: 'Publish', helper: 'Merge adapters for deployment' },
  { to: '/jobs', label: 'Activity', helper: 'Monitor running tasks' },
  { to: '/settings', label: 'Settings', helper: 'Manage workspace tokens' }
];

const PAGE_META = [
  {
    match: path => path === '/',
    kicker: 'Overview',
    title: 'Workspace overview',
    description: 'Monitor training progress, adapters on disk, and overall API health at a glance.',
    actions: [
      { to: '/train', label: 'Start fine-tuning', tone: 'primary' },
      { to: '/generate', label: 'Try your model', tone: 'ghost' }
    ]
  },
  {
    match: path => path.startsWith('/train'),
    kicker: 'Fine-tune',
    title: 'Configure a training run',
    description: 'Select data, tweak hyperparameters, and launch a LoRA fine-tuning job tailored to your needs.',
    actions: [
      { to: '/jobs', label: 'View activity', tone: 'ghost' }
    ]
  },
  {
    match: path => path.startsWith('/generate'),
    kicker: 'Playground',
    title: 'Test your latest checkpoint',
    description: 'Experiment with prompts, compare outputs, and share snippets with teammates.',
    actions: [
      { to: '/evaluate', label: 'Queue evaluation', tone: 'primary' }
    ]
  },
  {
    match: path => path.startsWith('/evaluate/dashboard'),
    kicker: 'Evaluation',
    title: 'Tracking benchmark performance',
    description: 'Visualise scoring runs and chart accuracy improvements across datasets.',
    actions: [
      { to: '/evaluate', label: 'Manage runs', tone: 'ghost' }
    ]
  },
  {
    match: path => path.startsWith('/evaluate'),
    kicker: 'Evaluation',
    title: 'Schedule and review scoring jobs',
    description: 'Submit datasets for automatic grading and inspect detailed results as they complete.',
    actions: [
      { to: '/evaluate/dashboard', label: 'Open dashboard', tone: 'primary' }
    ]
  },
  {
    match: path => path.startsWith('/merge'),
    kicker: 'Publish',
    title: 'Package adapters for deployment',
    description: 'Combine LoRA checkpoints, set metadata, and prepare artefacts for downstream hosting.',
    actions: [
      { to: '/jobs', label: 'Check job history', tone: 'ghost' }
    ]
  },
  {
    match: path => path.startsWith('/jobs'),
    kicker: 'Activity',
    title: 'Live job tracker',
    description: 'Follow every fine-tuning, evaluation, and merge task with real-time updates.',
    actions: [
      { to: '/train', label: 'Launch new training', tone: 'primary' }
    ]
  },
  {
    match: path => path.startsWith('/settings'),
    kicker: 'Settings',
    title: 'Workspace preferences',
    description: 'Manage tokens, tweak defaults, and configure integrations for your team.',
    actions: []
  }
];

function NavItem({ link }) {
  const baseClass = link.children ? 'nav-item has-children' : 'nav-item';

  return (
    <li className={baseClass}>
      <NavLink
        to={link.to}
        end={link.end}
        className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
      >
        <span className="nav-label">{link.label}</span>
        {link.helper && <span className="nav-helper">{link.helper}</span>}
      </NavLink>
      {link.children && (
        <ul className="nav-sublist">
          {link.children.map(child => (
            <li key={child.to}>
              <NavLink
                to={child.to}
                end={child.end}
                className={({ isActive }) => `nav-sublink${isActive ? ' active' : ''}`}
              >
                <span className="nav-label">{child.label}</span>
                {child.helper && <span className="nav-helper">{child.helper}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export default function App() {
  const [apiStatus, setApiStatus] = useState('checking');
  const location = useLocation();

  useEffect(() => {
    let canceled = false;

    const checkHealth = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/health`, { cache: 'no-store' });
        if (!canceled) {
          setApiStatus(response.ok ? 'up' : 'down');
        }
      } catch (err) {
        if (!canceled) {
          setApiStatus('down');
        }
      }
    };

    checkHealth();
    const intervalId = setInterval(checkHealth, 15000);

    return () => {
      canceled = true;
      clearInterval(intervalId);
    };
  }, []);

  const statusLabel = apiStatus === 'up' ? 'API online' : apiStatus === 'down' ? 'API offline' : 'Checking API…';
  const pageMeta = useMemo(() => {
    const path = location.pathname || '/';
    return PAGE_META.find(entry => entry.match(path)) ?? PAGE_META[0];
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <div className="app-layout">
        <aside className="sidebar" role="navigation" aria-label="Main navigation">
          <div className="sidebar-brand">
            <span className="app-logo" aria-hidden="true">★</span>
            <div>
              <p className="app-name">QLoRA Copilot</p>
              <p className="app-tagline">Guided workspace for custom language models</p>
            </div>
          </div>
          <nav className="sidebar-nav">
            <p className="sidebar-caption">Workflow</p>
            <ul>
              {NAV_LINKS.map(link => (
                <NavItem key={link.to} link={link} />
              ))}
            </ul>
          </nav>
          <div className="sidebar-status" data-state={apiStatus}>
            <div className="status-label">
              <span className="status-title">API status</span>
              <span className="status-helper">{statusLabel}</span>
            </div>
            <span className="api-dot" aria-hidden="true" />
          </div>
        </aside>
        <div className="main-panel">
          <header className="main-header" role="banner">
            <div className="main-header-inner">
              <div className="main-heading">
                {pageMeta.kicker && <span className="main-kicker">{pageMeta.kicker}</span>}
                <h1>{pageMeta.title}</h1>
                {pageMeta.description && <p>{pageMeta.description}</p>}
              </div>
              {pageMeta.actions?.length > 0 && (
                <div className="main-header-actions">
                  {pageMeta.actions.map(action => {
                    const classBase = action.tone === 'primary' ? 'primary-button' : 'ghost-button';
                    return (
                      <NavLink
                        key={action.to}
                        to={action.to}
                        className={({ isActive }) => `${classBase}${isActive ? ' active' : ''}`}
                      >
                        {action.label}
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          </header>
          <main id="main-content" className="app-main" role="main">
            <div className="container">
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/train" element={<TrainPage />} />
                <Route path="/generate" element={<GeneratePage />} />
                <Route path="/evaluate" element={<EvaluatePage />} />
                <Route path="/evaluate/dashboard" element={<EvaluationDashboardPage />} />
                <Route path="/merge" element={<MergePage />} />
                <Route path="/jobs" element={<JobsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </div>
          </main>
          <footer className="app-footer" role="contentinfo">
            <div className="container footer-inner">
              <p>
                Need a hint? Visit each page&apos;s quick start checklist or hover over the help icons to learn
                what a setting means.
              </p>
              <p className="footer-note">Designed for teams new to fine-tuning · Built with accessibility in mind</p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
