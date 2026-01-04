import { Request, Response } from "express";
import { UserService } from "./user.service.js";

export class UserController {
  static async checkProfile(req: Request, res: Response) {
    const { address } = req.params;
    if (!address) { return res.status(400).json({ error: "Address parameter is required" }); }
    const user = await UserService.getByAddress(address);
    if (!user) return res.status(404).json({ error: "Profile missing" });
    return res.json(user);
  }

  static async register(req: Request, res: Response) {
    const { address, nickname, signature, publicKey } = req.body;

    try {
        const user = await UserService.register(address, nickname, signature, publicKey);
        return res.status(201).json(user);
    } catch (err: any) {
        if (err.code === 'P2002') {
        return res.status(409).json({ 
            error: "This nickname is already taken. Please choose another one." 
        });
        }
    return res.status(401).json({ error: err.message || "Registration failed" });
  }
}
}