/**
 * TESSERACT-CONTEXT: Pruebas Unitarias del AST Skeletonizer (SWE-bench Style)
 */

import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { ASTSkeletonizer } from '../src/core/skeleton.ts';

test('ASTSkeletonizer: Omite cuerpos de métodos preservando firmas y tipos TypeScript', () => {
  const tsCode = `
import { Database } from './db.ts';

export interface User {
  id: string;
  name: string;
}

export class UserService {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
    this.setupConnection();
  }

  public async getUserById(id: string): Promise<User | null> {
    const raw = await this.db.query('SELECT * FROM users WHERE id = ?', id);
    if (!raw) return null;
    return {
      id: raw.id,
      name: raw.name,
    };
  }

  private setupConnection(): void {
    console.log('Connecting...');
  }
}
`;

  const res = ASTSkeletonizer.skeletonize(tsCode, 'service.ts');

  assert.ok(res.reductionPercentage > 20, `Debe reducir tokens, redujo: ${res.reductionPercentage}%`);
  assert.ok(res.skeletonCode.includes('import { Database } from'));
  assert.ok(res.skeletonCode.includes('export interface User'));
  assert.ok(res.skeletonCode.includes('export class UserService'));
  assert.ok(res.skeletonCode.includes('public async getUserById(id: string): Promise<User | null> { /* [tesseract: body omitted] */ }'));
  assert.ok(!res.skeletonCode.includes('SELECT * FROM users'), 'No debe contener SQL interno del método');
});

test('ASTSkeletonizer: Esqueletiza funciones de Python preservando def y type hints', () => {
  const pyCode = `
import os

def calculate_discount(price: float, rate: float = 0.1) -> float:
    \"\"\"Calcula el precio final con descuento.\"\"\"
    if price < 0:
        raise ValueError("Invalid price")
    discount = price * rate
    return price - discount

class OrderProcessor:
    def process_order(self, order_id: str) -> bool:
        print("Processing order")
        return True
`;

  const res = ASTSkeletonizer.skeletonize(pyCode, 'processor.py');

  assert.ok(res.reductionPercentage > 15);
  assert.ok(res.skeletonCode.includes('def calculate_discount(price: float, rate: float = 0.1) -> float:'));
  assert.ok(res.skeletonCode.includes('... # [tesseract: implementation omitted]'));
  assert.ok(!res.skeletonCode.includes('discount = price * rate'));
});
