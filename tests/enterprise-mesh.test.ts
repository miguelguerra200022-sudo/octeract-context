import test from 'node:test';
import assert from 'node:assert/strict';
import { DistributedMeshEngine, type MeshServiceDefinition, type MeshContract } from '../src/enterprise/mesh.ts';

test('DistributedMeshEngine: Registro de microservicios y coordenadas en panal {4,3,3,4}', () => {
  const mesh = new DistributedMeshEngine();

  const producer: MeshServiceDefinition = {
    id: 'product-catalog-service',
    name: 'Product Catalog API',
    repoPath: '/repos/product-service',
    latticeCoordinates: [0, 0, 0, 0],
    role: 'producer'
  };

  const consumer: MeshServiceDefinition = {
    id: 'frontend-checkout-service',
    name: 'Frontend Checkout Web',
    repoPath: '/repos/checkout-service',
    latticeCoordinates: [0, 0, 1, 0], // Adyacente en eje Z (+Z)
    role: 'consumer'
  };

  mesh.registerService(producer);
  mesh.registerService(consumer);

  const services = mesh.listServices();
  assert.equal(services.length, 2);
  assert.equal(services[0].id, 'product-catalog-service');
  assert.equal(services[1].id, 'frontend-checkout-service');
});

test('DistributedMeshEngine: Auditoría exitosa de contratos compatibles en faceta +Z (REST/OpenAPI)', () => {
  const mesh = new DistributedMeshEngine();

  mesh.registerService({
    id: 'producer-api',
    name: 'Producer API',
    repoPath: '/repos/producer',
    latticeCoordinates: [0, 0, 0, 0],
    role: 'producer'
  });

  mesh.registerService({
    id: 'consumer-app',
    name: 'Consumer App',
    repoPath: '/repos/consumer',
    latticeCoordinates: [0, 0, 1, 0],
    role: 'consumer'
  });

  // El proveedor expone GET /products con id, name, price
  const providerContract: MeshContract = {
    facet: '+Z',
    protocol: 'openapi',
    endpoints: [
      {
        path: '/products',
        method: 'GET',
        responseProperties: ['id', 'name', 'price'],
        requiredParameters: ['limit']
      }
    ]
  };

  // El consumidor espera consumir GET /products esperando id y name
  const consumerContract: MeshContract = {
    facet: '+Z',
    protocol: 'openapi',
    targetServiceId: 'producer-api',
    endpoints: [
      {
        path: '/products',
        method: 'GET',
        responseProperties: ['id', 'name'],
        requiredParameters: ['limit']
      }
    ]
  };

  mesh.publishFacetContract('producer-api', providerContract);
  mesh.publishFacetContract('consumer-app', consumerContract);

  const audit = mesh.auditMeshContracts();
  assert.equal(audit.fractures.length, 0);
  assert.equal(audit.score, 100);
});

test('DistributedMeshEngine: Detección precisa de fractura cruzada cuando el proveedor rompe contrato', () => {
  const mesh = new DistributedMeshEngine();

  mesh.registerService({
    id: 'user-service',
    name: 'User Microservice',
    repoPath: '/repos/user',
    latticeCoordinates: [0, 0, 0, 0],
    role: 'producer'
  });

  mesh.registerService({
    id: 'billing-service',
    name: 'Billing Microservice',
    repoPath: '/repos/billing',
    latticeCoordinates: [0, 0, 1, 0],
    role: 'consumer'
  });

  // El proveedor eliminó el campo 'email' o cambió la ruta
  const providerContract: MeshContract = {
    facet: '+Z',
    protocol: 'openapi',
    endpoints: [
      {
        path: '/users/{id}',
        method: 'GET',
        responseProperties: ['id', 'username'], // Falta 'email'
        requiredParameters: ['id']
      }
    ]
  };

  // El consumidor en billing necesita estrictamente 'email'
  const consumerContract: MeshContract = {
    facet: '+Z',
    protocol: 'openapi',
    targetServiceId: 'user-service',
    endpoints: [
      {
        path: '/users/{id}',
        method: 'GET',
        responseProperties: ['id', 'email'],
        requiredParameters: ['id']
      }
    ]
  };

  mesh.publishFacetContract('user-service', providerContract);
  mesh.publishFacetContract('billing-service', consumerContract);

  const audit = mesh.auditMeshContracts();
  assert.ok(audit.fractures.length > 0);
  assert.ok(audit.score < 100);

  const emailFracture = audit.fractures.find(f => f.property === 'email');
  assert.ok(emailFracture);
  assert.equal(emailFracture?.consumerServiceId, 'billing-service');
  assert.equal(emailFracture?.producerServiceId, 'user-service');
  assert.ok(emailFracture?.description.includes('Propiedad requerida faltante'));
});
