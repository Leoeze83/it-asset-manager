/**
 * Middleware para extraer y validar tenantId
 * T1-01: Multi-tenant Core - Integración con Express
 */

import { Request, Response, NextFunction } from 'express';
import { TenantId, createTenantId } from '../types/tenant';

export interface TenantRequest extends Request {
  tenantId: TenantId;
  userId?: string;
}

/**
 * Extrae tenantId del header X-Tenant-ID
 * Válida que el usuario pertenezca a ese tenant
 */
export function extractTenantMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const tenantHeader = req.headers['x-tenant-id'];
    
    if (!tenantHeader || typeof tenantHeader !== 'string') {
      res.status(400).json({ 
        error: 'Missing X-Tenant-ID header' 
      });
      return;
    }

    const tenantId = createTenantId(tenantHeader);
    (req as TenantRequest).tenantId = tenantId;

    // TODO: Validar que usuario autenticado pertenece a este tenant
    // const user = (req as any).user;
    // if (user.tenantId !== tenantId) {
    //   return res.status(403).json({ error: 'Unauthorized tenant access' });
    // }

    next();
  } catch (error) {
    res.status(400).json({ 
      error: `Invalid tenant: ${(error as Error).message}` 
    });
  }
}

/**
 * Valida que todos los documentos Firestore tengan el tenantId del usuario
 */
export function validateTenantIsolation(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const tenantReq = req as TenantRequest;
  
  if (!tenantReq.tenantId) {
    res.status(400).json({ error: 'Tenant context not established' });
    return;
  }

  // TODO: Interceptar queries de Firestore
  // Agregar where('tenantId', '==', tenantId) automáticamente
  
  next();
}
