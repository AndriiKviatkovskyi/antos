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
    // Extract bio and pfp from body
    const { address, nickname, signature, publicKey, bio, pfp } = req.body;

    if (!address || !nickname || !signature || !publicKey) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      // Pass the extra fields to the service
      const user = await UserService.register(address, nickname, signature, publicKey, bio, pfp);
      return res.status(201).json(user);
    } catch (err: any) {
      if (err.code === 'P2002' || err.message.includes("Unique constraint")) {
        return res.status(409).json({ error: "Nickname already taken" });
      }
      return res.status(401).json({ error: err.message });
    }
  }

  static async updateProfile(req: Request, res: Response) {
    const { address } = req.params;
    const { nickname, bio, pfp } = req.body;

    if (!address) return res.status(400).json({ error: "Address required" });

    try {
      const updatedUser = await UserService.update(address, { nickname, bio, pfp });
      return res.json(updatedUser);
    } catch (err: any) {
      if (err.code === 'P2002') return res.status(409).json({ error: "Nickname already taken" });
      return res.status(500).json({ error: "Failed to update profile" });
    }
  }
}