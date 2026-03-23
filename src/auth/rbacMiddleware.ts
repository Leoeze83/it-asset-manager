/**
 * T1-02: Middleware de validación de permisos RBAC
 */

import { Request, Response, NextFunction } from 'express';
import { Permission, hasPermission, Role } from './rbac';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  tenantId?: string;
  role?: Role;
}

/**
 * Middleware factory para validar permisos específicos
 */
export function checkPermission(...requiredPermissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;
    const userRole = authReq.role;

    if (!userRole) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const hasAccess = requiredPermissions.some(perm =>
      hasPermission(userRole, perm)
    );

    if (!hasAccess) {
      res.status(403).json({
        error: 'Insufficient permissions',
        requiredPermissions,
        userRole,
      });
      return;
    }

    next();
  };
}

/**
 * Middleware que requiere ALL permisos especificados
 */
export function requireAllPermissions(...requiredPermissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;
    const userRole = authReq.role;

    if (!userRole) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const hasAllAccess = requiredPermissions.every(perm =>
      hasPermission(userRole, perm)
    );

    if (!hasAllAccess) {
      res.status(403).json({
        error: 'Missing required permissions',
        requiredPermissions,
        userRole,
      });
      return;
    }

    next();
  };
}

/**
 * Middleware que verifica rol específico
 */
export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;
    const userRole = authReq.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      res.status(403).json({
        error: 'Insufficient role',
        allowedRoles,
        userRole,
      });
      return;
    }

    next();
  };
}
