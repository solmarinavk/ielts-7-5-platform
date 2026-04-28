import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './routes/Home.jsx';
import Plan from './routes/Plan.jsx';
import More from './routes/More.jsx';
import Settings from './routes/Settings.jsx';
import Resources from './routes/Resources.jsx';
import Vocab from './routes/Vocab.jsx';
import Mocks from './routes/Mocks.jsx';
import MockNew from './routes/MockNew.jsx';
import MockDetail from './routes/MockDetail.jsx';
import Errors from './routes/Errors.jsx';
import Writing from './routes/Writing.jsx';
import WritingNew from './routes/WritingNew.jsx';
import WritingDetail from './routes/WritingDetail.jsx';
import Speaking from './routes/Speaking.jsx';
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
        <Route path="/mocks" element={<Mocks />} />
        <Route path="/mocks/new" element={<MockNew />} />
        <Route path="/mocks/:id" element={<MockDetail />} />
        <Route path="/errors" element={<Errors />} />
        <Route path="/writing" element={<Writing />} />
        <Route path="/writing/new" element={<WritingNew />} />
        <Route path="/writing/:id" element={<WritingDetail />} />
        <Route path="/speaking" element={<Speaking />} />
        <Route path="/tracking" element={<Placeholder title="Tracking" sprint="Sprint 4" />} />
        <Route path="/export" element={<Placeholder title="Export" sprint="Sprint 4" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
      <InstallPrompt />
    </div>
  );
}
