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
}
