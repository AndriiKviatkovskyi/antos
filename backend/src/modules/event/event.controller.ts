import { Request, Response } from "express";
import { EventService } from "./event.service.js";

export class EventController {
  static async getUserWallets(req: Request, res: Response) {
    const { address } = req.params;

    if (!address) {
      return res.status(400).json({ error: "Address required" });
    }

    try {
      const wallets = await EventService.getWalletsForMember(address);
      return res.json(wallets);
    } catch (err) {
      console.error("Get wallets error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  }
}
