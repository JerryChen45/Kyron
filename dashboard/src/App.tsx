import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { RobotOverview } from './screens/RobotOverview';
import { MissionSetup } from './screens/MissionSetup';
import { SafetyReview } from './screens/SafetyReview';
import { LiveMonitoring } from './screens/LiveMonitoring';
import { OperationReview } from './screens/OperationReview';
import { DemoControlPanel } from './screens/DemoControlPanel';

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<RobotOverview />} />
          <Route path="/mission-setup" element={<MissionSetup />} />
          <Route path="/safety-review" element={<SafetyReview />} />
          <Route path="/monitoring" element={<LiveMonitoring />} />
          <Route path="/review" element={<OperationReview />} />
          <Route path="/demo" element={<DemoControlPanel />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}
