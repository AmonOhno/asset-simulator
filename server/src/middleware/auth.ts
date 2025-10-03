import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token not found.' });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error) {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    if (!user) {
      return res.status(401).json({ error: 'User not found.' });
    }

    (req as any).user = user;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error during authentication.' });
  }
};
