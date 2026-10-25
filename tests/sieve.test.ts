import { test } from "node:test";
import assert from "node:assert";
import { OcteractSieve } from "../src/core/sieve.ts";
import { OcteractDoctor } from "../src/unified/doctor.ts";
import { OcteractSee } from "../src/unified/see.ts";
import { OcteractAsk } from "../src/unified/ask.ts";

test("OcteractSieve: stripAnsi elimina secuencias de escape ANSI", () => {
  const raw = "\u001b[31mError fatal\u001b[0m en el modulo auth";
  const clean = OcteractSieve.stripAnsi(raw);
  assert.strictEqual(clean, "Error fatal en el modulo auth");
});

test("OcteractSieve: deduplicateLines colapsa lineas repetidas", () => {
  const lines = [
    "Conectando a base de datos...",
    "Reintentando...",
    "Reintentando...",
    "Reintentando...",
    "Reintentando...",
    "Fallo conexion.",
  ];
  const deduped = OcteractSieve.deduplicateLines(lines);
  assert.strictEqual(deduped[0], "Conectando a base de datos...");
  assert.strictEqual(deduped[1], "Reintentando...");
  assert.ok(deduped[2].includes("líneas idénticas omitidas"));
  assert.strictEqual(deduped[3], "Fallo conexion.");
});

test("OcteractSieve: sieveTestOutput aisla fallos y aserciones recortando > 60% de tokens", () => {
  const mockBlock = [
    "  PASS tests/auth.test.ts",
    "    ✓ login exitoso (10ms)",
    "    ✓ logout exitoso (5ms)",
    "  PASS tests/user.test.ts",
    "    ✓ crear usuario (12ms)",
    "    ✓ listar usuarios (8ms)",
    "  FAIL tests/payment.test.ts",
    "    ✕ procesar tarjeta debito (45ms)",
    "      AssertionError [ERR_ASSERTION]: Expected status 200, received 500",
    "        at Context.<anonymous> (tests/payment.test.ts:42:15)",
    "        at processImmediate (node:internal/timers:478:21)",
    "  PASS tests/orders.test.ts",
    "    ✓ calcular total (2ms)",
  ].join("\n");

  const mockTestOutput = Array(15).fill(mockBlock).join("\n");

  const res = OcteractSieve.sieveTestOutput(mockTestOutput);
  assert.strictEqual(res.detectedType, "test_output");
  assert.ok(res.reductionPercentage > 60, "Debe reducir mas del 60%");
  assert.ok(res.sievedContent.includes("FAIL tests/payment.test.ts"));
  assert.ok(res.sievedContent.includes("AssertionError"));
  assert.ok(!res.sievedContent.includes("calcular total"), "Debe descartar tests exitosos");
});

test("OcteractSieve: sieveLogStream filtra errores y omite lineas informativas", () => {
  const mockLogs = [
    "2026-10-25 10:00:00 [INFO] Servidor iniciado en puerto 3000",
    "2026-10-25 10:00:01 [DEBUG] Cargando configuracion de rutas",
    "2026-10-25 10:00:02 [DEBUG] Conectado a redis",
    "2026-10-25 10:00:03 [ERROR] Timeout al conectar con microservicio de pagos en 10.0.0.4",
    "2026-10-25 10:00:04 [INFO] Heartbeat OK",
  ].concat(Array(50).fill("2026-10-25 10:00:05 [INFO] Ping normal")).join("\n");

  const res = OcteractSieve.sieveLogStream(mockLogs);
  assert.strictEqual(res.detectedType, "log_stream");
  assert.ok(res.reductionPercentage > 70);
  assert.ok(res.sievedContent.includes("[ERROR]"));
});

test("OcteractSieve: sieveJSON pliega arrays grandes preservando claves", () => {
  const bigObj = {
    status: "ok",
    records: Array.from({ length: 100 }, (_, i) => ({ id: i, name: "item_" + i })),
  };
  const rawJSON = JSON.stringify(bigObj, null, 2);
  const res = OcteractSieve.sieveJSON(rawJSON);
  assert.strictEqual(res.detectedType, "json");
  assert.ok(res.reductionPercentage > 50);
  assert.ok(res.sievedContent.includes("_octeract_omitted_elements"));
});

test("OcteractSieve: sieveTabular comprime CSVs masivos preservando encabezados", () => {
  const header = "id,username,email,role,status";
  const rows = Array.from({ length: 80 }, (_, i) => `${i},user${i},user${i}@test.com,admin,active`);
  const csv = [header, ...rows].join("\n");

  const res = OcteractSieve.sieveTabular(csv);
  assert.strictEqual(res.detectedType, "tabular");
  assert.ok(res.reductionPercentage > 70);
  assert.ok(res.sievedContent.includes("id,username,email,role,status"));
  assert.ok(res.sievedContent.includes("filas intermedias colapsadas"));
});

test("OcteractDoctor: integra sieve al diagnosticar logOrOutput", async () => {
  const mockFailOutput = "FAIL src/auth.ts\nAssertionError: Token invalido en auth.ts:50";
  const report = await OcteractDoctor.diagnose(".", { logOrOutput: mockFailOutput });

  assert.ok(report.sieveSummary);
  assert.ok(report.topRecommendations.some((r) => r.includes("[Sieve]")));
  assert.ok(report.summaryMarkdown.includes("Sieve Terminal"));
});

test("OcteractSee: modo sieve comprime logs/CSVs automaticamente", async () => {
  const res = await OcteractSee.inspect("package.json", { mode: "sieve" });
  assert.strictEqual(res.mode, "sieve");
  assert.ok(res.content.length > 0);
  assert.ok(res.sieveSummary);
});

test("OcteractAsk: modo terse entrega respuestas condensadas de alta densidad", async () => {
  const res = await OcteractAsk.query("donde esta el motor de hipercubo", { terse: true });
  assert.ok(res.answer.length > 0);
  assert.ok(res.relevantFiles.length > 0);
});
