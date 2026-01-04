import { Request, Response } from "express";
import { UserService } from "./user.service.js";

export class UserController {
  static async checkProfile(req: Request, res: Response) {
    const { address } = req.params;
    if (!address) return res.status(400).json({ error: "Address required" });

    try {
      const user = await UserService.getByAddress(address);
      if (!user) return res.status(404).json({ error: "Profile missing" });
      return res.json(user);
    } catch (err) {
      return res.status(500).json({ error: "Server error" });
    }
  }

  static async register(req: Request, res: Response) {
    const { address, nickname, signature, publicKey } = req.body;

    // Basic Validation
    if (!address || !nickname || !signature || !publicKey) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const user = await UserService.register(address, nickname, signature, publicKey);
      return res.status(201).json(user);
    } catch (err: any) {
      // Handle Prisma Unique Constraint (Nickname taken)
      if (err.code === 'P2002' || err.message.includes("Unique constraint")) {
        return res.status(409).json({ error: "Nickname already taken" });
      }
      // Handle Auth failure
      return res.status(401).json({ error: err.message });
    }
  }
}