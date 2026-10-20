import { eventBus } from '../core/events.ts';

export type MeshFacetType = '+X' | '-X' | '+Y' | '-Y' | '+Z' | '-Z' | '+W' | '-W';

export interface MeshServiceDefinition {
  id: string;
  name: string;
  repoPath: string;
  latticeCoordinates: [number, number, number, number];
  role: 'producer' | 'consumer' | 'peer';
}

export interface MeshEndpointContract {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  responseProperties: string[];
  requiredParameters?: string[];
}

export interface MeshContract {
  facet: MeshFacetType;
  protocol: 'openapi' | 'grpc' | 'graphql' | 'pubsub';
  targetServiceId?: string;
  endpoints: MeshEndpointContract[];
}

export interface MeshFracture {
  consumerServiceId: string;
  producerServiceId: string;
  facet: MeshFacetType;
  endpointPath: string;
  method: string;
  property?: string;
  missingType?: 'endpoint' | 'property' | 'parameter';
  description: string;
}

export interface MeshAuditReport {
  score: number;
  fractures: MeshFracture[];
  servicesCount: number;
  contractsAudited: number;
}

export class DistributedMeshEngine {
  private services: Map<string, MeshServiceDefinition> = new Map();
  private contracts: Map<string, MeshContract[]> = new Map();

  /**
   * Registra un microservicio en el panal {4, 3, 3, 4}
   */
  public registerService(service: MeshServiceDefinition): void {
    this.services.set(service.id, service);
    if (!this.contracts.has(service.id)) {
      this.contracts.set(service.id, []);
    }
    eventBus.emitEvent('mesh:service_registered', { serviceId: service.id, name: service.name });
  }

  /**
   * Lista todos los servicios registrados en el Mesh
   */
  public listServices(): MeshServiceDefinition[] {
    return Array.from(this.services.values());
  }

  /**
   * Publica un contrato en una faceta hiperdimensional de un microservicio
   */
  public publishFacetContract(serviceId: string, contract: MeshContract): void {
    if (!this.services.has(serviceId)) {
      throw new Error(`Microservicio no registrado: ${serviceId}`);
    }
    const current = this.contracts.get(serviceId) || [];
    current.push(contract);
    this.contracts.set(serviceId, current);
  }

  /**
   * Audita la compatibilidad de todos los contratos cruzados entre microservicios
   */
  public auditMeshContracts(): MeshAuditReport {
    const fractures: MeshFracture[] = [];
    let contractsAudited = 0;

    for (const [consumerId, consumerContracts] of this.contracts.entries()) {
      const consumer = this.services.get(consumerId);
      if (!consumer) continue;

      for (const contract of consumerContracts) {
        if (!contract.targetServiceId) continue;
        contractsAudited++;

        const producerId = contract.targetServiceId;
        const producer = this.services.get(producerId);

        if (!producer) {
          fractures.push({
            consumerServiceId: consumerId,
            producerServiceId: producerId,
            facet: contract.facet,
            endpointPath: '*',
            method: 'GET',
            missingType: 'endpoint',
            description: `El servicio productor '${producerId}' referenciado por '${consumerId}' no existe en el Mesh.`
          });
          continue;
        }

        const producerContracts = (this.contracts.get(producerId) || []).filter(c => c.facet === contract.facet);

        for (const cEndpoint of contract.endpoints) {
          // Buscar si el proveedor ofrece este endpoint
          let matchingEndpoint: MeshEndpointContract | undefined;

          for (const pContract of producerContracts) {
            const found = pContract.endpoints.find(
              e => e.path === cEndpoint.path && e.method.toUpperCase() === cEndpoint.method.toUpperCase()
            );
            if (found) {
              matchingEndpoint = found;
              break;
            }
          }

          if (!matchingEndpoint) {
            fractures.push({
              consumerServiceId: consumerId,
              producerServiceId: producerId,
              facet: contract.facet,
              endpointPath: cEndpoint.path,
              method: cEndpoint.method,
              missingType: 'endpoint',
              description: `Endpoint no encontrado: El consumidor '${consumerId}' espera '${cEndpoint.method} ${cEndpoint.path}', pero el proveedor '${producerId}' no lo expone en la faceta ${contract.facet}.`
            });
            continue;
          }

          // Verificar compatibilidad de propiedades en la respuesta
          for (const reqProp of cEndpoint.responseProperties) {
            if (!matchingEndpoint.responseProperties.includes(reqProp)) {
              fractures.push({
                consumerServiceId: consumerId,
                producerServiceId: producerId,
                facet: contract.facet,
                endpointPath: cEndpoint.path,
                method: cEndpoint.method,
                property: reqProp,
                missingType: 'property',
                description: `Propiedad requerida faltante: El consumidor '${consumerId}' requiere '${reqProp}' en '${cEndpoint.path}', pero el proveedor '${producerId}' no la provee.`
              });
            }
          }
        }
      }
    }

    const score = Math.max(0, 100 - fractures.length * 20);

    const report: MeshAuditReport = {
      score,
      fractures,
      servicesCount: this.services.size,
      contractsAudited
    };

    eventBus.emitEvent('mesh:audit_completed', { score, fracturesCount: fractures.length });

    return report;
  }
}
