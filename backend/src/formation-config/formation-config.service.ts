import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { FormationZoneConfig } from './formation-zone-config.entity';
import { ZoneDto } from './dto/formation-config.dto';

export interface ZoneConfig {
  playerId: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ConfigStatus {
  configured: boolean;
  configuredCount: number;
  totalCount: number;
}

const GAME_BLOCKS: Array<{
  key: string;
  gameFamily: string;
  system: string | null;
  totalCount: number;
}> = [
  { key: 'reception_5_1', gameFamily: 'reception', system: '5-1', totalCount: 36 },
  { key: 'reception_4_2', gameFamily: 'reception', system: '4-2', totalCount: 36 },
  { key: 'reception_6_2', gameFamily: 'reception', system: '6-2', totalCount: 36 },
  { key: 'defense', gameFamily: 'defense', system: null, totalCount: 18 },
];

@Injectable()
export class FormationConfigService {
  constructor(
    @InjectRepository(FormationZoneConfig)
    private readonly repo: Repository<FormationZoneConfig>,
  ) {}

  async getZonesForRotation(
    gameFamily: string,
    system: string | null,
    idx: number,
  ): Promise<ZoneConfig[]> {
    const rows = await this.repo.find({
      where: system !== null
        ? { gameFamily, system, idx }
        : { gameFamily, system: IsNull(), idx },
    });

    return rows.map((row) => ({
      playerId: row.playerId,
      x: row.x,
      y: row.y,
      w: row.w,
      h: row.h,
    }));
  }

  async saveZonesForRotation(
    coachId: string,
    gameFamily: string,
    system: string | null,
    idx: number,
    zones: ZoneDto[],
  ): Promise<void> {
    for (const zone of zones) {
      const existing = await this.repo.findOne({
        where: system !== null
          ? { gameFamily, system, idx, playerId: zone.playerId }
          : { gameFamily, system: IsNull(), idx, playerId: zone.playerId },
      });

      if (existing) {
        existing.x = zone.x;
        existing.y = zone.y;
        existing.w = zone.w;
        existing.h = zone.h;
        existing.updatedBy = coachId;
        await this.repo.save(existing);
      } else {
        const entity = this.repo.create({
          gameFamily,
          system: system ?? undefined,
          idx,
          playerId: zone.playerId,
          x: zone.x,
          y: zone.y,
          w: zone.w,
          h: zone.h,
          updatedBy: coachId,
        });
        await this.repo.save(entity);
      }
    }
  }

  async getZoneForPlayer(
    gameFamily: string,
    system: string | null,
    idx: number,
    playerId: number,
  ): Promise<ZoneConfig | null> {
    const row = await this.repo.findOne({
      where: system !== null
        ? { gameFamily, system, idx, playerId }
        : { gameFamily, system: IsNull(), idx, playerId },
    });

    if (!row) return null;

    return {
      playerId: row.playerId,
      x: row.x,
      y: row.y,
      w: row.w,
      h: row.h,
    };
  }

  async isGameConfigured(gameFamily: string, system: string | null): Promise<ConfigStatus> {
    const block = GAME_BLOCKS.find(
      (b) => b.gameFamily === gameFamily && b.system === system,
    );
    const totalCount = block?.totalCount ?? 0;

    const count = await this.repo.count({
      where: system !== null
        ? { gameFamily, system }
        : { gameFamily, system: IsNull() },
    });

    return {
      configured: count >= totalCount,
      configuredCount: count,
      totalCount,
    };
  }

  async getAllConfigStatus(): Promise<Record<string, ConfigStatus>> {
    const result: Record<string, ConfigStatus> = {};
    for (const block of GAME_BLOCKS) {
      result[block.key] = await this.isGameConfigured(block.gameFamily, block.system);
    }
    return result;
  }

  resolveGameBlock(gameKey: string): { gameFamily: string; system: string | null } | null {
    const block = GAME_BLOCKS.find((b) => b.key === gameKey);
    if (!block) return null;
    return { gameFamily: block.gameFamily, system: block.system };
  }
}
