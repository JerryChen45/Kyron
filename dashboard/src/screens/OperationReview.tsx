import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRobotStore } from '../store/robotStore';
import { RouteMap } from '../components/map/RouteMap';
import { Badge, Button, Card, Stat } from '../components/ui';

export function OperationReview() {
  const navigate = useNavigate();
  const {
    missionResult,
    loadMissionResult,
    currentMission,
    fields,
    resetWorkflow,
    setReviewNote,
    reviewNote,
    loading,
  } = useRobotStore();

  const [flagged, setFlagged] = useState(false);

  useEffect(() => {
    if (!missionResult && currentMission) {
      loadMissionResult();
    }
  }, [missionResult, currentMission, loadMissionResult]);

  if (loading || !missionResult) {
    return <div className="text-center py-20 text-gray-500">Loading mission results…</div>;
  }

  const field = fields.find((f) => f.name === missionResult.fieldName);

  const handleNewMission = () => {
    resetWorkflow();
    navigate('/mission-setup');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Operation Review</h2>
          <p className="text-gray-500 text-sm mt-1">Mission {missionResult.missionId.slice(0, 8)}</p>
        </div>
        <Badge label={missionResult.completionStatus} />
      </div>

      <Card title="Mission Summary">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label="Robot" value={missionResult.robotName} />
          <Stat label="Field" value={missionResult.fieldName} />
          <Stat label="Operation" value={missionResult.operationType.replace(/_/g, ' ')} />
          <Stat label="Module" value={missionResult.module.name} />
          <Stat label="Duration" value={Math.floor(missionResult.durationSeconds / 60)} unit="min" />
          <Stat label="Area covered" value={(missionResult.areaCoveredSquareMeters / 10000).toFixed(2)} unit="ha" />
          <Stat label="Distance" value={missionResult.distanceTraveledMeters.toFixed(0)} unit="m" />
          <Stat label="Battery used" value={missionResult.batteryUsedPercent.toFixed(1)} unit="%" />
          <Stat label="Alerts" value={missionResult.alertCount} />
        </div>
      </Card>

      {missionResult.weedingResult && (
        <Card title="Weeding Results">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat label="Weeds detected" value={missionResult.weedingResult.weedsDetected} />
            <Stat label="Weeds treated" value={missionResult.weedingResult.weedsTreated} />
            <Stat label="Success rate" value={missionResult.weedingResult.treatmentSuccessRatePercent} unit="%" />
            <Stat label="Missed targets" value={missionResult.weedingResult.missedTargets} />
            <Stat label="Crop incidents" value={missionResult.weedingResult.cropSafetyIncidents} />
            <Stat label="Energy used" value={missionResult.weedingResult.energyUsedKwh} unit="kWh" />
          </div>
        </Card>
      )}

      {missionResult.sprayingResult && (
        <Card title="Spraying Results">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat label="Product used" value={missionResult.sprayingResult.productUsedLiters} unit="L" />
            <Stat label="Coverage" value={missionResult.sprayingResult.coveragePercent.toFixed(1)} unit="%" />
            <Stat label="Application rate" value={missionResult.sprayingResult.applicationRateLitersPerHectare} unit="L/ha" />
            <Stat label="Skipped zones" value={missionResult.sprayingResult.skippedZones} />
            <Stat label="Tank remaining" value={missionResult.sprayingResult.tankRemainingLiters} unit="L" />
          </div>
        </Card>
      )}

      {field && (
        <Card title="Coverage Map">
          <RouteMap
            boundary={field.boundary}
            completedRoute={missionResult.completedRoute}
            restrictedZones={missionResult.skippedZones}
            height="350px"
          />
        </Card>
      )}

      <Card title="Review Notes">
        <textarea
          className="w-full border border-gray-200 rounded-lg p-3 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]"
          placeholder="Add notes about this operation…"
          value={reviewNote}
          onChange={(e) => setReviewNote(e.target.value)}
        />
        <div className="flex gap-3 mt-4">
          <Button onClick={() => navigate('/')}>Accept Result</Button>
          <Button variant="secondary" onClick={() => setFlagged(!flagged)}>
            {flagged ? 'Issue Flagged' : 'Flag Issue'}
          </Button>
          <Button variant="secondary" onClick={handleNewMission}>
            Start Another Mission
          </Button>
        </div>
      </Card>
    </div>
  );
}
