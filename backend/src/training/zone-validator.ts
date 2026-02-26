import { ZoneConfig } from '../formation-config/formation-config.service';
import { Point } from './training.types';

export function isInRect(point: Point, zone: ZoneConfig): boolean {
  return (
    point.x >= zone.x &&
    point.x <= zone.x + zone.w &&
    point.y >= zone.y &&
    point.y <= zone.y + zone.h
  );
}
