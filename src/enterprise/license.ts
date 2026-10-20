import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

export interface LicensePayload {
  orgName: string;
  tier: 'community' | 'pro' | 'enterprise';
  maxFiles: number; // 2500 for community, 20000 for pro, -1 for unlimited
  features: string[]; // ["swe_ci", "lsc_monorepo", "mesh_microservices", "airgap_audit"]
  issuedAt: number;
  expiresAt: number; // Unix timestamp in ms
}

export interface LicenseVerificationResult {
  valid: boolean;
  payload?: LicensePayload;
  reason?: string;
}

export interface LicenseStatus {
  active: boolean;
  tier: 'community' | 'pro' | 'enterprise';
  orgName: string;
  expiresAt: number;
  daysRemaining: number;
  features: string[];
  maxFiles: number;
  isExpired: boolean;
}

// Clave pública de respaldo predeterminada para Tesseract Official
const DEFAULT_OFFICIAL_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAx5sQ3jK3VqF9/m7Yk7lW1z6e8h2+gQ4rP9uF5n2rM1E=
-----END PUBLIC KEY-----`;

export class EnterpriseLicenseManager {
  private publicKey: string;

  constructor(publicKey?: string) {
    this.publicKey = publicKey || DEFAULT_OFFICIAL_PUBLIC_KEY;
  }

  /**
   * Genera un par de claves criptográficas asimétricas Ed25519 nativas
   */
  public static generateKeyPair(): { publicKey: string; privateKey: string } {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    return { publicKey, privateKey };
  }

  /**
   * Emite y firma digitalmente un token de licencia empresarial con Ed25519
   */
  public static issueToken(payload: LicensePayload, privateKey: string): string {
    const jsonPayload = JSON.stringify(payload);
    const base64Payload = Buffer.from(jsonPayload, 'utf-8').toString('base64url');
    const headerTier = payload.tier.toUpperCase();
    const dataToSign = `${headerTier}.${base64Payload}`;

    const signature = crypto.sign(null, Buffer.from(dataToSign, 'utf-8'), privateKey);
    const base64Signature = signature.toString('base64url');

    return `TESS3-${headerTier}-${base64Payload}.${base64Signature}`;
  }

  /**
   * Verifica la autenticidad criptográfica y vigencia de un token de licencia
   */
  public verifyToken(token: string): LicenseVerificationResult {
    if (!token || typeof token !== 'string') {
      return { valid: false, reason: 'Token de licencia vacío o inválido.' };
    }

    const dotIndex = token.indexOf('.');
    if (dotIndex === -1) {
      return { valid: false, reason: 'Formato de token inválido (separador "." faltante).' };
    }

    const prefixAndPayload = token.slice(0, dotIndex);
    const base64Signature = token.slice(dotIndex + 1);

    const match = prefixAndPayload.match(/^TESS3-([A-Z]+)-([A-Za-z0-9_-]+)$/);
    if (!match) {
      return { valid: false, reason: 'Formato de cabecera de token inválido (debe iniciar con TESS3-<TIER>-).' };
    }

    const tier = match[1].toLowerCase() as 'community' | 'pro' | 'enterprise';
    const base64Payload = match[2];
    const dataToVerify = `${match[1]}.${base64Payload}`;

    let payload: LicensePayload;
    try {
      const decodedJson = Buffer.from(base64Payload, 'base64url').toString('utf-8');
      payload = JSON.parse(decodedJson);
    } catch {
      return { valid: false, reason: 'Payload corrupto o JSON inválido.' };
    }

    // Verificación de firma Ed25519
    try {
      const signatureBuffer = Buffer.from(base64Signature, 'base64url');
      const isVerified = crypto.verify(
        null,
        Buffer.from(dataToVerify, 'utf-8'),
        this.publicKey,
        signatureBuffer
      );

      if (!isVerified) {
        return { valid: false, reason: 'Firma criptográfica inválida (firma forjada o clave pública discordante).' };
      }
    } catch (err: any) {
      return { valid: false, reason: `Error al validar firma criptográfica: ${err?.message || err}` };
    }

    // Verificación de expiración
    if (payload.expiresAt && Date.now() > payload.expiresAt) {
      return { valid: false, payload, reason: `Licencia expirada el ${new Date(payload.expiresAt).toISOString()}.` };
    }

    return { valid: true, payload };
  }

  /**
   * Activa y persiste la licencia en la ruta del proyecto (.tesseract/license.key)
   */
  public activateLicense(token: string, projectRoot: string = process.cwd()): boolean {
    const verification = this.verifyToken(token);
    if (!verification.valid) {
      throw new Error(`Activación fallida: ${verification.reason}`);
    }

    const tesseractDir = path.join(projectRoot, '.tesseract');
    if (!fs.existsSync(tesseractDir)) {
      fs.mkdirSync(tesseractDir, { recursive: true });
    }

    const licensePath = path.join(tesseractDir, 'license.key');
    fs.writeFileSync(licensePath, token.trim(), 'utf-8');
    return true;
  }

  /**
   * Carga el estado actual de la licencia instalada en el proyecto
   */
  public getLicenseStatus(projectRoot: string = process.cwd()): LicenseStatus {
    const licensePath = path.join(projectRoot, '.tesseract', 'license.key');
    
    if (!fs.existsSync(licensePath)) {
      // Licencia predeterminada por defecto: Community
      return {
        active: false,
        tier: 'community',
        orgName: 'Community User (Open Source / Evaluation)',
        expiresAt: 0,
        daysRemaining: -1,
        features: ['audit', 'slice', 'shadow', 'mcp'],
        maxFiles: 2500,
        isExpired: false
      };
    }

    try {
      const token = fs.readFileSync(licensePath, 'utf-8').trim();
      const verification = this.verifyToken(token);

      if (!verification.valid || !verification.payload) {
        return {
          active: false,
          tier: 'community',
          orgName: 'Invalid / Corrupted License',
          expiresAt: 0,
          daysRemaining: 0,
          features: ['audit', 'slice', 'shadow', 'mcp'],
          maxFiles: 2500,
          isExpired: true
        };
      }

      const p = verification.payload;
      const daysRemaining = p.expiresAt ? Math.max(0, Math.ceil((p.expiresAt - Date.now()) / (1000 * 60 * 60 * 24))) : 9999;

      return {
        active: true,
        tier: p.tier,
        orgName: p.orgName,
        expiresAt: p.expiresAt,
        daysRemaining,
        features: p.features,
        maxFiles: p.maxFiles,
        isExpired: false
      };
    } catch {
      return {
        active: false,
        tier: 'community',
        orgName: 'Community User',
        expiresAt: 0,
        daysRemaining: -1,
        features: ['audit', 'slice', 'shadow', 'mcp'],
        maxFiles: 2500,
        isExpired: false
      };
    }
  }

  /**
   * Valida estrictamente que una característica empresarial esté permitida en el tier actual
   */
  public assertFeature(feature: string, projectRoot: string = process.cwd()): void {
    const status = this.getLicenseStatus(projectRoot);

    // Jerarquía de características
    const enterpriseOnlyFeatures = ['mesh_microservices', 'lsc_monorepo', 'airgap_audit'];
    const proFeatures = ['swe_ci', 'sarif_export', ...enterpriseOnlyFeatures];

    if (enterpriseOnlyFeatures.includes(feature) && status.tier !== 'enterprise') {
      throw new Error(`[BSL-1.1 SHIELD] Característica '${feature}' denegada. Requiere tier enterprise (Tier actual: ${status.tier}). Contacte a licencias@tesseract.ai para activar su nodo.`);
    }

    if (proFeatures.includes(feature) && status.tier === 'community') {
      throw new Error(`[BSL-1.1 SHIELD] Característica '${feature}' denegada. Requiere tier pro o enterprise (Tier actual: community).`);
    }

    if (status.tier !== 'community' && !status.features.includes(feature)) {
      throw new Error(`[BSL-1.1 SHIELD] Característica '${feature}' no incluida en el tier ${status.tier} para la organización ${status.orgName}.`);
    }
  }

  /**
   * Valida el límite de archivos indexados según el tier
   */
  public assertFileLimit(fileCount: number, projectRoot: string = process.cwd()): void {
    const status = this.getLicenseStatus(projectRoot);
    if (status.maxFiles !== -1 && fileCount > status.maxFiles) {
      throw new Error(`[BSL-1.1 SHIELD] Límite de archivos excedido (${fileCount} > ${status.maxFiles}) para el tier ${status.tier}. Actualice a Enterprise para soporte ilimitado.`);
    }
  }
}
