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

export interface AllConfigStatus {
  reception_5_1: ConfigStatus;
  reception_4_2: ConfigStatus;
  reception_6_2: ConfigStatus;
  defense: ConfigStatus;
}
