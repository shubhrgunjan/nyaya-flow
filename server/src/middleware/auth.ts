import { Request, Response, NextFunction } from 'express';

/**
 * Auth middleware — for hackathon/dev mode, we accept requests without tokens.
 * In production, this would verify Firebase ID tokens using firebase-admin.
 * 
 * The middleware extracts uid from the Authorization header if present,
 * otherwise allows the request through with a dev uid.
 */
export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    // In a full production setup, we'd verify the Firebase ID token here:
    // const token = authHeader.split('Bearer ')[1];
    // const decoded = await admin.auth().verifyIdToken(token);
    // (req as any).uid = decoded.uid;
    
    // For now, trust the uid passed in the request body or use a placeholder
    (req as any).uid = (req.body && req.body.uid) || 'authenticated-user';
  } else {
    // Dev mode: allow unauthenticated requests
    (req as any).uid = 'dev-user';
  }

  next();
}
