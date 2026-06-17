import { useState } from 'react';
import { appConfig } from '../config/appConfig';
import { getRobotService } from '../services/robot';
import { SIMULATION_PROFILES, type SimulationProfile } from '../services/robot/mockData';
import type { RobotAlert } from '../models/robot';
import { useRobotStore } from '../store/robotStore';
import { Button, Card } from '../components/ui';

const ALERT_TYPES: RobotAlert['type'][] = [
  'low_battery',
  'obstacle_detected',
  'module_fault',
  'connection_interrupted',
  'tank_level_low',
  'overheating',
  'route_blocked',
];

export function DemoControlPanel() {
  const demo = getRobotService().demo;
  const resetWorkflow = useRobotStore((s) => s.resetWorkflow);
  const initialize = useRobotStore((s) => s.initialize);
  const [battery, setBattery] = useState(87);
  const [progress, setProgress] = useState(50);

  if (!appConfig.showDemoControls || !demo) {
    return (
      <div className="text-center py-20 text-gray-500">
        Demo controls are disabled. Set VITE_SHOW_DEMO_CONTROLS=true to enable.
      </div>
    );
  }

  const handleReset = async () => {
    await demo.resetSimulation();
    resetWorkflow();
    await initialize();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Demo Control Panel</h2>
        <p className="text-gray-500 text-sm mt-1">
          Developer and presenter controls — not visible in production
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card title="Simulation">
          <div className="space-y-2">
            <Button onClick={handleReset} className="w-full">
              Reset Simulation
            </Button>
            <Button onClick={() => demo.completeMissionImmediately()} variant="secondary" className="w-full">
              Complete Mission Immediately
            </Button>
            <Button onClick={() => demo.triggerCommandFailure()} variant="secondary" className="w-full">
              Trigger Command Failure
            </Button>
            <Button onClick={() => demo.triggerConnectionLoss()} variant="secondary" className="w-full">
              Trigger Connection Loss
            </Button>
          </div>
        </Card>

        <Card title="Mission Progress">
          <div className="space-y-3">
            <input
              type="range"
              min={0}
              max={100}
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-sm text-gray-600">{progress}%</p>
            <Button onClick={() => demo.setMissionProgress(progress)} className="w-full">
              Set Progress
            </Button>
          </div>
        </Card>

        <Card title="Robot State">
          <div className="space-y-3">
            <input
              type="range"
              min={5}
              max={100}
              value={battery}
              onChange={(e) => setBattery(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-sm text-gray-600">Battery: {battery}%</p>
            <Button onClick={() => demo.setBatteryLevel(battery)} className="w-full">
              Set Battery
            </Button>
          </div>
        </Card>

        <Card title="Trigger Alerts">
          <div className="grid grid-cols-2 gap-2">
            {ALERT_TYPES.map((type) => (
              <Button
                key={type}
                variant="secondary"
                onClick={() => demo.triggerAlert(type)}
                className="text-xs"
              >
                {type.replace(/_/g, ' ')}
              </Button>
            ))}
          </div>
        </Card>

        <Card title="Simulation Profiles" className="md:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SIMULATION_PROFILES.map((profile) => (
              <button
                key={profile.id}
                onClick={() => demo.selectSimulationProfile(profile.id as SimulationProfile)}
                className="text-left p-3 rounded-lg border border-gray-200 hover:border-[#2d6a4f] hover:bg-emerald-50 transition-colors"
              >
                <p className="font-medium text-sm">{profile.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{profile.description}</p>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
