import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { OcteractMultiNoiseBiomes } from '../src/voxel/multi-noise.ts';

test('OcteractMultiNoiseBiomes: classifies legacy core as DEEP_FROZEN_OCEAN', () => {
  const engine = new OcteractMultiNoiseBiomes();
  const sampleLegacyCore = `
    export class CoreKernelFoundation {
      private readonly id: string;
      constructor() { this.id = "KERNEL_V1"; }
      public getID(): string { return this.id; }
    }
  `;

  const report = engine.classify('src/core/kernel.ts', sampleLegacyCore, {
    centrality: 0.9,
    churnScore: 0.05, // Almost never modified
    astDepth: 5,
  });

  assert.equal(report.biome, 'DEEP_FROZEN_OCEAN');
  assert.ok(report.maxPermissibleShear <= 0.05, 'El núcleo congelado debe tener cizallamiento ultra-estricto');
  assert.ok(report.recommendedSafetyGear.length > 0);
});

test('OcteractMultiNoiseBiomes: classifies high-centrality high-churn file as JAGGED_PEAKS', () => {
  const engine = new OcteractMultiNoiseBiomes();
  const sampleHotPivot = `
    export function routeOrchestrator(command: string) {
      if (command === "audit") return runAudit();
      if (command === "slice") return runSlice();
      return runHelp();
    }
  `;

  const report = engine.classify('src/index.ts', sampleHotPivot, {
    centrality: 0.95,
    churnScore: 0.9, // High churn
    astDepth: 2,
  });

  assert.equal(report.biome, 'JAGGED_PEAKS');
  assert.ok(report.climateVector.continentalness > 0.7);
  assert.ok(report.climateVector.erosion > 0.7);
});

test('OcteractMultiNoiseBiomes: classifies event-heavy files as ANCIENT_CITY_SCULK', () => {
  const engine = new OcteractMultiNoiseBiomes();
  const eventHeavyCode = `
    import { eventBus } from './events.ts';
    export class SensorListener {
      listen() {
        eventBus.on('mutation', () => this.handle());
        eventBus.on('fracture', () => this.alarm());
        eventBus.emit('vibration', { frequency: 440 });
      }
    }
  `;

  const report = engine.classify('src/core/listener.ts', eventHeavyCode);
  assert.equal(report.biome, 'ANCIENT_CITY_SCULK');
  assert.ok(report.recommendedSafetyGear.includes('Sneak') || report.recommendedSafetyGear.includes('silencio'));
});

test('OcteractMultiNoiseBiomes: classifies simple DTOs as MEADOW_PLAINS', () => {
  const engine = new OcteractMultiNoiseBiomes();
  const simpleDTO = `
    export interface UserProfile {
      id: string;
      name: string;
      age: number;
    }
  `;

  const report = engine.classify('src/models/user.ts', simpleDTO);
  assert.equal(report.biome, 'MEADOW_PLAINS');
  assert.ok(report.maxPermissibleShear >= 0.25);
});
