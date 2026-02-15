// src/pages/WalletDetailsPage.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import type { InputEntryFunctionData } from "@aptos-labs/ts-sdk";
import { walletStyles as s } from "../styles/componentStyles";
import { MULTISIG_MODULE } from "../constants";
import { useWallet } from "@aptos-labs/wallet-adapter-react";

const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));

// Voting modes
const MODE_MAJORITY = 1;
const MODE_COMBINED = 4;

const hexToString = (hex: string) => {
  try {
    const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
    if (!cleanHex) return "";
    return new TextDecoder().decode(new Uint8Array(cleanHex.match(/.{1,2}/g)!.map(b => parseInt(b, 16))));
  } catch { return hex; }
};

const bytesToHex = (bytes: Uint8Array) => "0x" + Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");

export function WalletDetailsPage() {
  const { address } = useParams<{ address: string }>();
  const { account, signAndSubmitTransaction } = useWallet();
  const currentUserHex = account?.address?.data ? bytesToHex(account.address.data) : null;

  const [walletData, setWalletData] = useState<any | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [status, setStatus] = useState("Loading...");
  const [showOwners, setShowOwners] = useState(false);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteAddress, setInviteAddress] = useState("");
  const [inviteRole, setInviteRole] = useState<"owner" | "admin">("owner");

  const [showGovernanceModal, setShowGovernanceModal] = useState(false);
  const [onlyAdminsInitiate, setOnlyAdminsInitiate] = useState(false);
  const [onlyAdminsVote, setOnlyAdminsVote] = useState(false);
  const [adminsCanVeto, setAdminsCanVeto] = useState(false);
  const [votingMode, setVotingMode] = useState<number>(MODE_MAJORITY);
  const [tierTwo, setTierTwo] = useState("");
  const [tierThree, setTierThree] = useState("");

  const formatApt = (octas: string | number) => (Number(octas)/100_000_000).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 3 });

  async function fetchData() {
    if (!address) return;
    try {
      setStatus("Loading...");
      const resource = await aptos.getAccountResource({ accountAddress: address, resourceType: `${MULTISIG_MODULE}::MultisigStore` as const });
      if (resource.name) resource.name = hexToString(resource.name);
      setWalletData(resource);

      const response = await aptos.view({ payload: { function: `${MULTISIG_MODULE}::get_wallet_info`, typeArguments: [], functionArguments: [address] } });
      setBalance((response[0] as any).balance);
      setStatus("");
    } catch (e) {
      console.error(e);
      setStatus("Failed to fetch wallet data.");
    }
  }

  useEffect(() => { fetchData(); }, [address]);

  const isOwner = currentUserHex && walletData?.owners?.some((o: string) => o.toLowerCase() === currentUserHex.toLowerCase());
  const isAdmin = currentUserHex && walletData?.admins?.some((a: string) => a.toLowerCase() === currentUserHex.toLowerCase());
  const walletFull = walletData && walletData.owners.length >= walletData.max_owners;
  const isBlacklisted = walletData && walletData.membership_blacklist?.some((addr: string) => addr.toLowerCase() === inviteAddress.toLowerCase());

  async function handleInvite() {
    if (!address || !inviteAddress) return;
    await signAndSubmitTransaction({ data: { function: `${MULTISIG_MODULE}::invite_owner`, functionArguments: [address, inviteAddress, inviteRole === "admin"] } });
    setShowInviteModal(false); setInviteAddress("");
  }

  function openGovernanceModal() {
    if (!walletData) return;
    setOnlyAdminsInitiate(walletData.only_admins_can_initiate);
    setOnlyAdminsVote(walletData.only_admins_can_vote);
    setAdminsCanVeto(walletData.admins_can_veto);
    setVotingMode(walletData.voting_mode);
    setTierTwo(walletData.tier_two_threshold?.toString() ?? "0");
    setTierThree(walletData.tier_three_threshold?.toString() ?? "0");
    setShowGovernanceModal(true);
  }

  async function handleGovernanceUpdate() {
    if (!account || !address) return;
    try {
      setStatus("Updating governance config...");
      const payload: InputEntryFunctionData = {
        function: `${MULTISIG_MODULE}::update_governance_configs`,
        typeArguments: [],
        functionArguments: [
          address,
          onlyAdminsInitiate,
          onlyAdminsVote,
          adminsCanVeto,
          votingMode,
          votingMode === MODE_COMBINED ? Number(tierTwo) : 0,
          votingMode === MODE_COMBINED ? Number(tierThree) : 0,
        ],
      };
      const response = await signAndSubmitTransaction({ data: payload });
      await aptos.waitForTransaction({ transactionHash: response.hash });
      setShowGovernanceModal(false);
      await new Promise(r => setTimeout(r, 800));
      await fetchData();
      setStatus("Governance config updated.");
    } catch (e) {
      console.error(e);
      setStatus("Transaction failed.");
    }
  }

  return (
    <div style={s.container}>
      {status && <p style={s.statusText}>{status}</p>}

      {walletData && (
        <div style={s.pageGrid}>
          {/* OWNER BOX */}
          <div style={s.sideBox}>
            <div style={s.sideHeader}>Owner Functions</div>
            <div style={s.sideBody}>{isOwner ? <p>Owner-only content</p> : <p>Sorry, you're not this wallet's owner</p>}</div>
          </div>

          {/* MAIN WALLET */}
          <div style={s.walletBox}>
            <div style={{ ...s.walletHeader, ...(walletData.is_charity ? s.walletHeaderCharity : s.walletHeaderNormal) }}>
              <div>
                <div style={s.walletName}>{walletData.name}</div>
                <div style={s.walletAddress}>{address}</div>
              </div>
            </div>
            <div style={s.walletBody}>
              <div>APT Balance: {balance ? `${formatApt(balance)} APT` : "N/A"}</div>
              <div style={s.ownersHeader} onClick={() => setShowOwners(!showOwners)}>{showOwners ? "▼" : "▶"} Owners ({walletData.owners.length} / {walletData.max_owners})</div>
              {showOwners && (
                <ul style={s.ownersList}>
                  {walletData.owners.map((owner: string) => (
                    <li key={owner} style={s.ownerItem}>
                      {owner}{walletData.admins.includes(owner) && <span style={s.adminStar}>★</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* ADMIN BOX */}
          <div style={s.sideBox}>
            <div style={s.sideHeader}>Admin Functions</div>
            <div style={s.sideBody}>
              {isAdmin ? (
                <>
                  <button style={s.primaryButton} onClick={() => setShowInviteModal(true)}>Invite user</button>
                  <div style={{ height: 12 }} />
                  <button style={s.primaryButton} onClick={openGovernanceModal}>Governance config</button>
                </>
              ) : <p>Sorry, you're not this wallet's admin</p>}
            </div>
          </div>
        </div>
      )}

      {/* INVITE MODAL */}
      {showInviteModal && (
        <div style={s.modalOverlay}>
          <div style={s.modal}>
            {walletFull ? <p>Wallet is full</p> : <>
              <h3>Invite User</h3>
              <input style={s.input} placeholder="0x..." value={inviteAddress} onChange={e => setInviteAddress(e.target.value)} />
              <select style={s.select} value={inviteRole} onChange={e => setInviteRole(e.target.value as "owner" | "admin")}>
                <option value="owner">Owner</option>
                <option value="admin">Admin</option>
              </select>
              {isBlacklisted && <p style={s.errorText}>Alert! This user is blacklisted from joining the wallet</p>}
              <div style={s.modalButtons}>
                <button style={s.primaryButton} disabled={isBlacklisted} onClick={handleInvite}>Invite</button>
                <button style={s.secondaryButton} onClick={() => setShowInviteModal(false)}>Cancel</button>
              </div>
            </>}
          </div>
        </div>
      )}

      {/* GOVERNANCE MODAL */}
      {showGovernanceModal && (
        <div style={s.modalOverlay}>
          <div style={s.modal}>
            <h3>Governance Configuration</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label><input type="checkbox" checked={onlyAdminsInitiate} onChange={e => setOnlyAdminsInitiate(e.target.checked)} /> Only Admins Can Initiate</label>
              <label><input type="checkbox" checked={onlyAdminsVote} onChange={e => setOnlyAdminsVote(e.target.checked)} /> Only Admins Can Vote</label>
              <label><input type="checkbox" checked={adminsCanVeto} onChange={e => setAdminsCanVeto(e.target.checked)} /> Admins Can Veto</label>
            </div>
            <select style={s.select} value={votingMode} onChange={e => setVotingMode(Number(e.target.value))}>
              <option value={1}>Majority</option>
              <option value={2}>Two Thirds</option>
              <option value={3}>Unanimous</option>
              <option value={4}>Combined</option>
            </select>
            {votingMode === MODE_COMBINED && <>
              <input style={s.input} type="number" placeholder="Tier Two Threshold" value={tierTwo} onChange={e => setTierTwo(e.target.value)} />
              <input style={s.input} type="number" placeholder="Tier Three Threshold" value={tierThree} onChange={e => setTierThree(e.target.value)} />
            </>}
            <div style={s.modalButtons}>
              <button style={s.primaryButton} onClick={handleGovernanceUpdate}>Change</button>
              <button style={s.secondaryButton} onClick={() => setShowGovernanceModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
