import { NavLink, Route, Routes } from 'react-router-dom';
import TrainPage from './pages/TrainPage.jsx';
import GeneratePage from './pages/GeneratePage.jsx';
import EvaluatePage from './pages/EvaluatePage.jsx';
import MergePage from './pages/MergePage.jsx';
import JobsPage from './pages/JobsPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';

const links = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/train', label: 'Train' },
  { to: '/generate', label: 'Generate' },
  { to: '/evaluate', label: 'Evaluate' },
  { to: '/merge', label: 'Merge' },
  { to: '/jobs', label: 'Jobs' }
];

export default function App() {
  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <div className="logo" style={{ fontWeight: 700, fontSize: '1.1rem' }}>
            QLoRA Control Center
          </div>
          <div className="nav-links">
            {links.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
      <main className="container">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/train" element={<TrainPage />} />
          <Route path="/generate" element={<GeneratePage />} />
          <Route path="/evaluate" element={<EvaluatePage />} />
          <Route path="/merge" element={<MergePage />} />
          <Route path="/jobs" element={<JobsPage />} />
        </Routes>
      </main>
    </>
  );
}
