import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { LSCEngine, type LSCPlan } from '../src/enterprise/lsc.ts';

test('LSCEngine: Identifica call sites y planifica refactorización en monorrepo', () => {
  const tempDir = path.join(process.cwd(), 'tests', 'temp_lsc_test_1');
  fs.mkdirSync(path.join(tempDir, 'packages', 'ui', 'src'), { recursive: true });
  fs.mkdirSync(path.join(tempDir, 'apps', 'web', 'app'), { recursive: true });
  fs.mkdirSync(path.join(tempDir, 'apps', 'docs', 'app'), { recursive: true });

  // Paquete UI que exporta el botón
  const buttonFile = path.join(tempDir, 'packages', 'ui', 'src', 'Button.ts');
  fs.writeFileSync(buttonFile, `
export interface ButtonProps { label: string; }
export function LegacyButton(props: ButtonProps) {
  return props.label;
}
`, 'utf-8');

  // App Web que consume LegacyButton
  const webFile = path.join(tempDir, 'apps', 'web', 'app', 'page.ts');
  fs.writeFileSync(webFile, `
import { LegacyButton } from '../../packages/ui/src/Button.ts';
export function HomePage() {
  return LegacyButton({ label: 'Click Me' });
}
`, 'utf-8');

  // App Docs que consume LegacyButton
  const docsFile = path.join(tempDir, 'apps', 'docs', 'app', 'page.ts');
  fs.writeFileSync(docsFile, `
import { LegacyButton } from '../../packages/ui/src/Button.ts';
export function DocsPage() {
  return LegacyButton({ label: 'Docs' });
}
`, 'utf-8');

  try {
    const lsc = new LSCEngine(tempDir);
    const plan = lsc.planTransformation({
      sourceFile: path.join('packages', 'ui', 'src', 'Button.ts'),
      oldSymbol: 'LegacyButton',
      newSymbol: 'ModernButton',
      generateBackwardCompatibleFacade: true
    });

    assert.equal(plan.affectedFiles.length, 3); // Button.ts, web/page.ts, docs/page.ts
    assert.equal(plan.callSitesCount, 4);
    assert.ok(plan.facadeGenerated);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('LSCEngine: Ejecuta reescritura atómica multi-paquete con preservación semántica', () => {
  const tempDir = path.join(process.cwd(), 'tests', 'temp_lsc_test_2');
  fs.mkdirSync(path.join(tempDir, 'packages', 'core'), { recursive: true });
  fs.mkdirSync(path.join(tempDir, 'services', 'order'), { recursive: true });

  const coreFile = path.join(tempDir, 'packages', 'core', 'calc.ts');
  fs.writeFileSync(coreFile, `
export function computeTotal(a: number, b: number): number {
  return a + b;
}
`, 'utf-8');

  const orderFile = path.join(tempDir, 'services', 'order', 'checkout.ts');
  fs.writeFileSync(orderFile, `
import { computeTotal } from '../../packages/core/calc.ts';
export function checkout() {
  return computeTotal(10, 20);
}
`, 'utf-8');

  try {
    const lsc = new LSCEngine(tempDir);
    const plan = lsc.planTransformation({
      sourceFile: path.join('packages', 'core', 'calc.ts'),
      oldSymbol: 'computeTotal',
      newSymbol: 'calculateInvoiceTotal',
      generateBackwardCompatibleFacade: true
    });

    const execution = lsc.executeTransformation(plan);
    assert.equal(execution.success, true);
    assert.equal(execution.modifiedFiles.length, 2);

    // Verificar que core/calc.ts ahora tiene calculateInvoiceTotal Y la fachada computeTotal
    const updatedCore = fs.readFileSync(coreFile, 'utf-8');
    assert.ok(updatedCore.includes('calculateInvoiceTotal'));
    assert.ok(updatedCore.includes('export const computeTotal = calculateInvoiceTotal'));

    // Verificar que services/order/checkout.ts fue actualizado al nuevo símbolo
    const updatedOrder = fs.readFileSync(orderFile, 'utf-8');
    assert.ok(updatedOrder.includes('calculateInvoiceTotal'));

    // Verificar reporte formal de preservación semántica
    const verification = lsc.verifySemanticPreservation(plan);
    assert.equal(verification.preserved, true);
    assert.ok(verification.proofDetails.length > 0);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
