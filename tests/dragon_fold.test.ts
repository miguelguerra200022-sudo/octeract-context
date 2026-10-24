import test from 'node:test';
import assert from 'node:assert/strict';
import { OcteractDragonFold } from '../src/dragon/dragonFold.ts';

test('OcteractDragonFold: folds private method bodies and preserves public contracts', () => {
  const code = `
    export interface DataModel {
      id: string;
      value: number;
    }

    export class ServiceManager {
      public async processItem(item: DataModel): Promise<boolean> {
        const val = this.calculateHeavyInternalLogic(item);
        return val > 0;
      }

      private calculateHeavyInternalLogic(item: DataModel): number {
        let total = 0;
        for (let i = 0; i < 1000; i++) {
          total += item.value * i;
          if (total > 500) break;
        }
        return total;
      }
    }
  `;

  const result = OcteractDragonFold.foldCode(code, 'service.ts');

  assert.equal(result.filePath, 'service.ts');
  assert.ok(result.foldedLines < result.originalLines);
  assert.ok(result.tokenSavingsPercent > 0);
  assert.ok(result.valleyFoldsCount >= 2); // interface + processItem
  assert.ok(result.mountainFoldsCount >= 1); // calculateHeavyInternalLogic
  assert.ok(result.foldedCode.includes('[DRAGON_MOUNTAIN_FOLD:'));
  assert.ok(result.foldedCode.includes('export interface DataModel'));
});

test('OcteractDragonFold: selectively unfolds specific target declaration', () => {
  const code = `
    export class Demo {
      public greet(name: string): string {
        return "Hello " + name;
      }
    }
  `;

  const unfolded = OcteractDragonFold.unfoldTarget(code, 'greet');
  assert.ok(unfolded);
  assert.ok(unfolded.includes('return "Hello " + name;'));
});
