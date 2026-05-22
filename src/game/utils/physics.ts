import Phaser from 'phaser';
import { SHOT } from '../constants';
import type { TableBounds } from '../types';

export const clampMagnitude = (vector: Phaser.Math.Vector2, maxLength: number): Phaser.Math.Vector2 => {
  const length = vector.length();

  if (length > maxLength && length > 0) {
    return vector.clone().scale(maxLength / length);
  }

  return vector.clone();
};

export const powerFromSwipe = (distance: number): number => {
  const normalized = Phaser.Math.Clamp(distance / SHOT.maxSwipeDistance, 0, 1);
  return Phaser.Math.Linear(SHOT.minPower, SHOT.maxPower, normalized);
};

export const isBodyStopped = (body: Phaser.Physics.Arcade.Body): boolean => body.speed <= SHOT.stopSpeedThreshold;

export const stopBody = (body: Phaser.Physics.Arcade.Body): void => {
  body.setVelocity(0, 0);
  body.setAcceleration(0, 0);
};

export const isPointOutsideTable = (x: number, y: number, table: TableBounds): boolean =>
  x < table.left || x > table.right || y < table.top || y > table.bottom;

export const edgeDistance = (x: number, y: number, table: TableBounds): number => {
  if (isPointOutsideTable(x, y, table)) {
    return 0;
  }

  return Math.min(x - table.left, table.right - x, y - table.top, table.bottom - y);
};
