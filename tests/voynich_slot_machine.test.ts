import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { OcteractSlotMachineValidator } from '../src/voynich/slot-machine.ts';

test('OcteractSlotMachineValidator: accepts valid canonical declaration slots in O(1)', () => {
  const validator = new OcteractSlotMachineValidator();

  const validStatements = [
    'export async function verifySignature(token: string): Promise<boolean> { return true; }',
    'public static readonly MAX_RETRIES: number = 5;',
    'export class QuantumOptimizer<T> { constructor() {} }',
    'private async calculateHash(buffer: Buffer): Promise<string> { return ""; }',
    'export interface ServiceConfig { port: number; }',
  ];

  for (const stmt of validStatements) {
    const verdict = validator.validate(stmt);
    assert.equal(verdict.valid, true, `Debe aceptar declaración válida: ${stmt}`);
    assert.ok(verdict.slots, 'Debe extraer ranuras');
    assert.ok(verdict.identifier.length > 0, 'Debe extraer identificador');
  }
});

test('OcteractSlotMachineValidator: rejects permuted or broken slot positions immediately', () => {
  const validator = new OcteractSlotMachineValidator();

  const invalidStatements = [
    'function async export brokenOrder() {}',             // Orden invertido de modificadores
    'public 123InvalidName() {}',                         // Identificador numérico ilegal
    'async export class Broken {}',                       // async antes de export class
    'function (missingIdentifier) {}',                    // Falta identificador
    'export interface { noName: boolean }',               // Interfaz sin nombre
  ];

  for (const stmt of invalidStatements) {
    const verdict = validator.validate(stmt);
    assert.equal(verdict.valid, false, `Debe rechazar declaración inválida: ${stmt}`);
    assert.ok(verdict.violationReason, 'Debe proveer razón de la violación de ranura');
  }
});

test('OcteractSlotMachineValidator: extracts structured slots cleanly', () => {
  const validator = new OcteractSlotMachineValidator();
  const stmt = 'export async function login(user: string, pass: string): Promise<Session>';
  const verdict = validator.validate(stmt);

  assert.equal(verdict.valid, true);
  assert.equal(verdict.slots?.scope, 'export');
  assert.equal(verdict.slots?.concurrency, 'async');
  assert.equal(verdict.slots?.kind, 'function');
  assert.equal(verdict.slots?.identifier, 'login');
  assert.equal(verdict.slots?.returnContract, 'Promise<Session>');
});
