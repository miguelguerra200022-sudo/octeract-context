import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import {
  OcteractEVAAST,
  OcteractMontemurroEngine,
  OcteractSlotMachineValidator,
  OcteractCurrierClassifier,
  OcteractEntropyGuard,
  OcteractCardanGrilleFuzzer,
} from '../src/voynich/index.ts';

test('Octeract Voynich & EVA Suite: all 6 engines cooperate seamlessly on production code', () => {
  const sampleCode = `
    import * as fs from 'node:fs';
    export class CryptographicSessionManager {
      private activeSessions: Map<string, number> = new Map();
      public async validateToken(token: string): Promise<boolean> {
        if (!token || token.length < 16) return false;
        return true;
      }
    }
  `;

  // 1. EVA AST Transliteration
  const eva = new OcteractEVAAST();
  const evaResult = eva.transliterate(sampleCode);
  assert.ok(evaResult.slots.length >= 2, 'EVA debe extraer slots de clase y método');
  assert.ok(evaResult.tokenReductionPercent > 50, 'EVA debe comprimir tokens');

  // 2. Montemurro & Zanette Semantic Analysis
  const montemurro = new OcteractMontemurroEngine();
  const mmResult = montemurro.analyzeCorpus([
    { id: 'session.ts', content: sampleCode },
    { id: 'config.ts', content: 'export const PORT = 8080;' },
  ]);
  assert.ok(mmResult.keywords.length > 0, 'Montemurro debe extraer keywords');

  // 3. Slot-Machine Validator
  const slotMachine = new OcteractSlotMachineValidator();
  const slotVerdict = slotMachine.validate('public async validateToken(token: string): Promise<boolean>');
  assert.equal(slotVerdict.valid, true, 'Slot-Machine debe aceptar firma válida');

  // 4. Currier Dialect Classifier
  const currier = new OcteractCurrierClassifier();
  const currierVerdict = currier.classify('src/security/session.ts', sampleCode);
  assert.equal(currierVerdict.dialect, 'DIALECT_B_IMPERATIVE_CORE', 'Debe clasificar como Dialecto B Core');

  // 5. Entropy Guard (h2)
  const entropyGuard = new OcteractEntropyGuard();
  const entropyReport = entropyGuard.computeSecondOrderEntropy(sampleCode);
  assert.equal(entropyReport.isSafe, true, 'Código real debe tener entropía segura');
  assert.equal(entropyReport.verdict, 'HEALTHY');

  // 6. Cardan Grille In-RAM Fuzzer
  const fuzzer = new OcteractCardanGrilleFuzzer();
  const mutants = fuzzer.generateMutants(sampleCode, 5);
  assert.ok(mutants.length > 0, 'Cardan Grille debe generar mutantes sintéticos en RAM');
});
