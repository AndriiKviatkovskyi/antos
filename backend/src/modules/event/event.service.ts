import { prisma } from "../../prisma.js";

export class EventService {
  static async getWalletsForMember(address: string): Promise<string[]> {
    // Fetch all membership events for this member ordered by newest first
    const events = await prisma.membershipEvent.findMany({
      where: { member: address },
      orderBy: { version: "desc" },
    });

    // Map to store latest event per wallet
    const latestPerWallet = new Map<string, string>();

    for (const event of events) {
      // If we already processed this wallet, skip (because we ordered DESC)
      if (!latestPerWallet.has(event.walletAddress)) {
        latestPerWallet.set(event.walletAddress, event.action);
      }
    }

    // Filter wallets where latest action is JOINED
    const activeWallets = Array.from(latestPerWallet.entries())
        .filter(([_, action]) => action === "JOINED")
        .map(([wallet]) => wallet);

      return activeWallets;
    }

    static async getPendingInvitesForUser(
      invitee: string
    ): Promise<
      {
        walletAddress: string;
        actor: string;
        timestamp: Date;
      }[]
    > {
      const events = await prisma.inviteEvent.findMany({
        where: { invitee },
        orderBy: { version: "desc" },
      });

      const latestPerWallet = new Map<
        string,
        {
          action: string;
          actor: string;
          timestamp: Date;
        }
      >();

      for (const event of events) {
        if (!latestPerWallet.has(event.walletAddress)) {
          latestPerWallet.set(event.walletAddress, {
            action: event.action,
            actor: event.actor,
            timestamp: event.timestamp,
          });
        }
      }

      return Array.from(latestPerWallet.entries())
        .filter(([_, data]) => data.action === "SENT")
        .map(([walletAddress, data]) => ({
          walletAddress,
          actor: data.actor,
          timestamp: data.timestamp,
        }));
    }

    static async getAllCharityWallets(): Promise<
      { walletAddress: string; admin: string; timestamp: Date }[]
    > {

      const events = await prisma.initializeEvent.findMany({
        where: { action: "INITIALIZED_CHARITY" },
        orderBy: { version: "desc" },
      });

      const latestPerWallet = new Map<
        string,
        { admin: string; timestamp: Date }
      >();

      for (const event of events) {
        if (!latestPerWallet.has(event.walletAddress)) {
          latestPerWallet.set(event.walletAddress, {
            admin: event.admin,
            timestamp: event.timestamp,
          });
        }
      }

      return Array.from(latestPerWallet.entries()).map(
        ([walletAddress, data]) => ({
          walletAddress,
          admin: data.admin,
          timestamp: data.timestamp,
        })
      );
    }
}
