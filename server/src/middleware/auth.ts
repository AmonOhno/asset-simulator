import { Request, Response, NextFunction } from "express";
import { supabase } from "../config/supabase";

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Invalid authorization header format." });
  }

  const token = authHeader.substring(7); // "Bearer " の部分を削除

  try {
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    req.user = data.user;
    next();
    
  } catch (err) {
    console.error("Auth middleware error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
};
