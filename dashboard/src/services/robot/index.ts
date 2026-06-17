import { appConfig } from '../../config/appConfig';
import type { RobotServiceWithDemo } from './RobotService';
import { MockRobotAdapter } from './MockRobotAdapter';
import { RealRobotAdapter } from './RealRobotAdapter';

let instance: RobotServiceWithDemo | null = null;

export function getRobotService(): RobotServiceWithDemo {
  if (!instance) {
    instance =
      appConfig.robotProvider === 'api'
        ? new RealRobotAdapter()
        : new MockRobotAdapter();
  }
  return instance;
}

export function setRobotService(service: RobotServiceWithDemo): void {
  instance = service;
}
