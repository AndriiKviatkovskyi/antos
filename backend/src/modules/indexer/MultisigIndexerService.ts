import axios from "axios";
import { prisma } from "../../prisma.js";
import dotenv from "dotenv";

dotenv.config();

const { NODE_URL, CONTRACT_ADDRESS, POLL_INTERVAL_MS = 10000 } = process.env;

const eventMapping: Record<
  string,
  { structTag: string; fieldName: string }
> = {
  MembershipEvent: {
    structTag: `${CONTRACT_ADDRESS}::multisig::ModuleEvents`,
    fieldName: "membership_events",
  },
  InviteEvent: {
    structTag: `${CONTRACT_ADDRESS}::multisig::ModuleEvents`,
    fieldName: "invite_events",
  },
  InitializeEvent: {
    structTag: `${CONTRACT_ADDRESS}::multisig::ModuleEvents`,
    fieldName: "initialize_events",
  },
  ProposalEvent: {
    structTag: `${CONTRACT_ADDRESS}::multisig::ModuleEvents`,
    fieldName: "proposal_events",
  },
  GovernanceEvent: {
    structTag: `${CONTRACT_ADDRESS}::multisig::ModuleEvents`,
    fieldName: "governance_events",
  },
};

const lastVersions: Record<string, bigint> = {
  MembershipEvent: BigInt(0),
  InviteEvent: BigInt(0),
  InitializeEvent: BigInt(0),
  ProposalEvent: BigInt(0),
  GovernanceEvent: BigInt(0),
};


export class MultisigIndexerService {
  startPolling() {
    console.log("[indexer] Starting Multisig polling...");
    setInterval(() => this.pollEvents(), Number(POLL_INTERVAL_MS));
  }

  decodeWalletName(walletNameBytes: number[]): string {
    return Buffer.from(walletNameBytes).toString("utf-8");
  }

  async pollEvents() {
    try {
      for (const eventType of Object.keys(eventMapping)) {
        await this.fetchAndStore(eventType);
      }
    } catch (err) {
      console.error("[indexer] Polling error:", err);
    }
  }

  async fetchAndStore(eventType: string) {
    const mapping = eventMapping[eventType];
    if (!mapping) return;

    const { structTag, fieldName } = mapping;
    const url = `${NODE_URL}/accounts/${CONTRACT_ADDRESS}/events/${structTag}/${fieldName}`;

    try {
      const resp = await axios.get(url);
      const events: any[] = resp.data;

      if (!events.length) {
        //console.log(`[indexer] No events yet for ${eventType}`);
        return;
      }

      for (const e of events) {
        const version = BigInt(e.version);
        if(lastVersions[eventType])
        if (version <= lastVersions[eventType]) continue;

        switch (eventType) {
          case "MembershipEvent":
            await this.saveMembership(e);
            break;
          case "InviteEvent":
            await this.saveInvite(e);
            break;
          case "InitializeEvent":
            await this.saveInitialize(e);
            break;
          case "ProposalEvent":
            await this.saveProposal(e);
            break;
          case "GovernanceEvent":
            await this.saveGovernance(e);
            break;
        }

        if(lastVersions[eventType])
        if (version > lastVersions[eventType]) lastVersions[eventType] = version;
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        //console.warn(`[indexer] No events yet for ${eventType}`);
        return;
      }
      console.error(`[indexer] fetch error for ${eventType}:`, err.message);
    }
  }

  // ---------- Save Methods ----------

  async saveMembership(e: any) {
    const d = e.data;
    await prisma.membershipEvent.upsert({
      where: { version: BigInt(e.version) },
      create: {
        walletAddress: d.wallet_address,
        walletName: this.decodeWalletName(d.wallet_name),
        action: d.action,
        member: d.member,
        actor: d.actor,
        version: BigInt(e.version),
      },
      update: {},
    });
  }

  async saveInvite(e: any) {
    const d = e.data;
    await prisma.inviteEvent.upsert({
      where: { version: BigInt(e.version) },
      create: {
        walletAddress: d.wallet_address,
        walletName: this.decodeWalletName(d.wallet_name),
        action: d.action,
        invitee: d.invitee,
        actor: d.actor,
        version: BigInt(e.version),
      },
      update: {},
    });
  }

  async saveInitialize(e: any) {
    const d = e.data;
    await prisma.initializeEvent.upsert({
      where: { version: BigInt(e.version) },
      create: {
        walletAddress: d.wallet_address,
        walletName: this.decodeWalletName(d.wallet_name),
        action: d.action,
        admin: d.admin,
        version: BigInt(e.version),
      },
      update: {},
    });
  }

  async saveProposal(e: any) {
    const d = e.data;
    await prisma.proposalEvent.upsert({
      where: { version: BigInt(e.version) },
      create: {
        walletAddress: d.wallet_address,
        proposalId: BigInt(d.proposal_id),
        action: d.action,
        actor: d.actor,
        version: BigInt(e.version),
      },
      update: {},
    });
  }

  async saveGovernance(e: any) {
    const d = e.data;
    await prisma.governanceEvent.upsert({
      where: { version: BigInt(e.version) },
      create: {
        walletAddress: d.wallet_address,
        action: d.action,
        actor: d.actor,
        version: BigInt(e.version),
      },
      update: {},
    });
  }
}
