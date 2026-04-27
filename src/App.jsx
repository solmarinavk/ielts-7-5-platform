import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './routes/Home.jsx';
import Plan from './routes/Plan.jsx';
import More from './routes/More.jsx';
import Settings from './routes/Settings.jsx';
import Resources from './routes/Resources.jsx';
import Vocab from './routes/Vocab.jsx';
import Placeholder from './routes/Placeholder.jsx';
import BottomNav from './components/BottomNav.jsx';
import InstallPrompt from './components/InstallPrompt.jsx';

export default function App() {
  return (
    <div className="min-h-full">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/plan" element={<Plan />} />
        <Route path="/more" element={<More />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/vocab" element={<Vocab />} />
        <Route path="/mocks" element={<Placeholder title="Mock tests" sprint="Sprint 2" />} />
        <Route path="/mocks/:id" element={<Placeholder title="Mock details" sprint="Sprint 2" />} />
        <Route path="/errors" element={<Placeholder title="Error log" sprint="Sprint 2" />} />
        <Route path="/writing" element={<Placeholder title="Writing" sprint="Sprint 3" />} />
        <Route path="/speaking" element={<Placeholder title="Speaking" sprint="Sprint 3" />} />
        <Route path="/tracking" element={<Placeholder title="Tracking" sprint="Sprint 4" />} />
        <Route path="/export" element={<Placeholder title="Export" sprint="Sprint 4" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
      <InstallPrompt />
    </div>
  );
}
