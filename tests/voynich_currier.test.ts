import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { OcteractCurrierClassifier } from '../src/voynich/currier.ts';

test('OcteractCurrierClassifier: correctly classifies Declarative UI (Dialect A)', () => {
  const classifier = new OcteractCurrierClassifier();

  const reactCode = `
    import React, { useState, useEffect } from 'react';
    export const UserProfileView: React.FC<Props> = ({ user }) => {
      const [isActive, setIsActive] = useState(false);
      return (
        <div className="profile-container">
          <h1>{user.name}</h1>
          <button onClick={() => setIsActive(!isActive)}>Toggle</button>
        </div>
      );
    };
  `;

  const verdict = classifier.classify('src/ui/Profile.tsx', reactCode);

  assert.equal(verdict.dialect, 'DIALECT_A_DECLARATIVE_UI');
  assert.ok(verdict.confidence >= 0.7, 'Confianza en Dialecto A debe ser >= 0.7');
  assert.equal(verdict.recommendedShearTolerance, 0.25, 'Dialecto UI permite mayor tolerancia de cizallamiento');
});

test('OcteractCurrierClassifier: correctly classifies Imperative Async Core (Dialect B)', () => {
  const classifier = new OcteractCurrierClassifier();

  const backendCode = `
    import * as fs from 'node:fs/promises';
    export class TransactionManager {
      public async commitTransaction(txId: string, buffer: Buffer): Promise<void> {
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            await fs.writeFile('/tmp/tx-' + txId, buffer);
            return;
          } catch (err) {
            await delay(100);
          }
        }
      }
    }
  `;

  const verdict = classifier.classify('src/core/tx.ts', backendCode);

  assert.equal(verdict.dialect, 'DIALECT_B_IMPERATIVE_CORE');
  assert.ok(verdict.confidence >= 0.7, 'Confianza en Dialecto B debe ser >= 0.7');
  assert.equal(verdict.recommendedShearTolerance, 0.10, 'Dialecto Core exige tolerancia estricta 0.10');
});

test('OcteractCurrierClassifier: correctly classifies Pure Type Contracts (Dialect C)', () => {
  const classifier = new OcteractCurrierClassifier();

  const typesCode = `
    export type HyperVertexId = string;
    export interface SystemConfig {
      host: string;
      port: number;
      ssl: boolean;
      timeout: number;
    }
    export type OperationCallback = (err: Error | null, result?: unknown) => void;
  `;

  const verdict = classifier.classify('src/types.ts', typesCode);

  assert.equal(verdict.dialect, 'DIALECT_C_CONTRACT_TYPES');
  assert.ok(verdict.confidence >= 0.7, 'Confianza en Dialecto C debe ser >= 0.7');
  assert.equal(verdict.recommendedShearTolerance, 0.05, 'Dialecto Tipos exige tolerancia ultra estricta 0.05');
});
