// src/pages/WalletDetailsPage.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { walletStyles as s } from "../styles/componentStyles";
import { MULTISIG_MODULE } from "../constants";
import { useWallet } from "@aptos-labs/wallet-adapter-react";

const aptos = new Aptos(
  new AptosConfig({ network: Network.TESTNET })
);

function hexToString(hex: string): string {
  try {
    const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
    if (cleanHex.length === 0) return "";
    const bytes = new Uint8Array(
      cleanHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
    );
    return new TextDecoder().decode(bytes);
  } catch {
    return hex;
  }
}

function bytesToHex(bytes: Uint8Array) {
  return "0x" + Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

export function WalletDetailsPage() {
  const { address } = useParams<{ address: string }>();
  const { account, signAndSubmitTransaction } = useWallet();

  const currentUserHex = account?.address?.data
    ? bytesToHex(account.address.data)
    : null;

  const [walletData, setWalletData] = useState<any | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [status, setStatus] = useState("Loading...");
  const [showOwners, setShowOwners] = useState(false);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteAddress, setInviteAddress] = useState("");
  const [inviteRole, setInviteRole] = useState<"owner" | "admin">("owner");

  function formatApt(octas: string | number): string {
    const apt = Number(octas) / 100_000_000;
    return apt.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 3 });
  }

  useEffect(() => {
    if (!address) return;

    const fetchData = async () => {
      try {
        setStatus("Loading...");

        const resource = await aptos.getAccountResource({
          accountAddress: address,
          resourceType: `${MULTISIG_MODULE}::MultisigStore` as const,
        });

        const data = resource;
        if (data.name) data.name = hexToString(data.name);
        setWalletData(data);

        const response = await aptos.view({
          payload: {
            function: `${MULTISIG_MODULE}::get_wallet_info`,
            typeArguments: [],
            functionArguments: [address],
          },
        });

        setBalance((response[0] as any).balance);
        setStatus("");
      } catch (e) {
        console.error(e);
        setStatus("Failed to fetch wallet data.");
      }
    };

    fetchData();
  }, [address]);

  const isOwner =
    currentUserHex &&
    walletData?.owners?.some((o: string) => o.toLowerCase() === currentUserHex.toLowerCase());

  const isAdmin =
    currentUserHex &&
    walletData?.admins?.some((a: string) => a.toLowerCase() === currentUserHex.toLowerCase());

  const walletFull =
    walletData &&
    walletData.owners.length >= walletData.max_owners;

  const isBlacklisted =
    walletData &&
    walletData.membership_blacklist?.some(
      (addr: string) => addr.toLowerCase() === inviteAddress.toLowerCase()
    );

  async function handleInvite() {
    if (!address || !inviteAddress) return;

    await signAndSubmitTransaction({
      sender: account!.address,
      data: {
        function: `${MULTISIG_MODULE}::invite_owner`,
        functionArguments: [
          address,
          inviteAddress,
          inviteRole === "admin",
        ],
      },
    });

    setShowInviteModal(false);
    setInviteAddress("");
  }

  return (
    <div style={s.container}>
      {status && <p style={s.statusText}>{status}</p>}

      {walletData && (
        <div style={s.pageGrid}>
          {/* OWNER BOX */}
          <div style={s.sideBox}>
            <div style={s.sideHeader}>Owner Functions</div>
            <div style={s.sideBody}>
              {isOwner ? (
                <p>Owner-only content</p>
              ) : (
                <p>Sorry, you're not this wallet's owner</p>
              )}
            </div>
          </div>

          {/* MAIN WALLET */}
          <div style={s.walletBox}>
            <div
              style={{
                ...s.walletHeader,
                ...(walletData.is_charity
                  ? s.walletHeaderCharity
                  : s.walletHeaderNormal),
              }}
            >
              <div>
                <div style={s.walletName}>{walletData.name}</div>
                <div style={s.walletAddress}>{address}</div>
              </div>
            </div>

            <div style={s.walletBody}>
              <div>APT Balance: {balance ? `${formatApt(balance)} APT` : "N/A"}</div>

              <div style={s.ownersHeader} onClick={() => setShowOwners(!showOwners)}>
                {showOwners ? "▼" : "▶"} Owners ({walletData.owners.length} / {walletData.max_owners})
              </div>

              {showOwners && (
                <ul style={s.ownersList}>
                  {walletData.owners.map((owner: string) => (
                    <li key={owner} style={s.ownerItem}>
                      {owner}
                      {walletData.admins.includes(owner) && (
                        <span style={s.adminStar}>★</span>
                      )}
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
                  <button
                    style={s.primaryButton}
                    onClick={() => setShowInviteModal(true)}
                  >
                    Invite user
                  </button>
                </>
              ) : (
                <p>Sorry, you're not this wallet's admin</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL */}
      {showInviteModal && (
        <div style={s.modalOverlay}>
          <div style={s.modal}>
            {walletFull ? (
              <p>Wallet is full</p>
            ) : (
              <>
                <h3>Invite User</h3>

                <input
                  style={s.input}
                  placeholder="0x..."
                  value={inviteAddress}
                  onChange={(e) => setInviteAddress(e.target.value)}
                />

                <select
                  style={s.select}
                  value={inviteRole}
                  onChange={(e) =>
                    setInviteRole(e.target.value as "owner" | "admin")
                  }
                >
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                </select>

                {isBlacklisted && (
                  <p style={s.errorText}>
                    Alert! This user is blacklisted from joining the wallet
                  </p>
                )}

                <div style={s.modalButtons}>
                  <button
                    style={s.primaryButton}
                    disabled={isBlacklisted}
                    onClick={handleInvite}
                  >
                    Invite
                  </button>

                  <button
                    style={s.secondaryButton}
                    onClick={() => setShowInviteModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
