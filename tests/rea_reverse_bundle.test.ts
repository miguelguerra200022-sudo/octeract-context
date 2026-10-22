import test from 'node:test';
import assert from 'node:assert/strict';
import { OcteractReverseBundle } from '../src/rea/reverseBundle.ts';

test('OcteractReverseBundle: identifies webpack bundle and extracts internal modules', () => {
  const webpackCode = `
    (function(modules) {
      function __webpack_require__(moduleId) { return modules[moduleId]; }
    })({
      "./src/auth.js": (function(module, exports, __webpack_require__) {
        const crypto = __webpack_require__("crypto");
        exports.login = function(user, pass) {
          if (!user) throw new Error("empty");
          return crypto.hash(pass);
        };
      }),
      "./src/db.js": (function(module, exports, __webpack_require__) {
        exports.saveRecord = function(doc) {
          const sqlite = require("sqlite3");
          return sqlite.insert(doc);
        };
      })
    });
  `;

  const report = OcteractReverseBundle.analyzeBundle(webpackCode, 'app.pack.js');

  assert.equal(report.format, 'webpack');
  assert.ok(report.totalModulesFound >= 2);
  assert.equal(report.reconstructionConfidence, 95);

  const authMod = report.modules.find((m) => m.name.includes('auth'));
  assert.ok(authMod);
  assert.equal(authMod.cell, 'Security');
  assert.ok(authMod.exportedSymbols.includes('login'));

  const dbMod = report.modules.find((m) => m.name.includes('db'));
  assert.ok(dbMod);
  assert.equal(dbMod.cell, 'Storage');
  assert.ok(dbMod.exportedSymbols.includes('saveRecord'));
});

test('OcteractReverseBundle: identifies rollup/esbuild bundle structure', () => {
  const esbuildCode = `
    var init_render = __esm({
      "src/ui/render.js"() {
        var component = React.createElement("div", null);
        exports.renderView = () => component;
      }
    });
    var init_fetch = __esm({
      "src/net/api.js"() {
        exports.fetchData = async (url) => { return await fetch(url); };
      }
    });
  `;

  const report = OcteractReverseBundle.analyzeBundle(esbuildCode, 'dist.js');
  assert.equal(report.format, 'rollup_or_esbuild');
  assert.ok(report.totalModulesFound >= 2);

  const renderMod = report.modules.find((m) => m.name.includes('render'));
  assert.ok(renderMod);
  assert.equal(renderMod.cell, 'UI');

  const netMod = report.modules.find((m) => m.name.includes('api'));
  assert.ok(netMod);
  assert.equal(netMod.cell, 'Network');
});

test('OcteractReverseBundle: flags suspicious dynamic eval indicators', () => {
  const suspiciousCode = `
    exports.runDynamic = function(payload) {
      return eval(payload);
    };
  `;

  const report = OcteractReverseBundle.analyzeBundle(suspiciousCode, 'untrusted.js');
  assert.ok(report.securityFlags.some((f) => f.flag === 'dynamic_eval_call'));
});
