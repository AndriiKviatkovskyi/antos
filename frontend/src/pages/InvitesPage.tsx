import { useState, useEffect } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { profileStyles as s } from "../styles/componentStyles";
import { API_BASE, MULTISIG_MODULE } from "../constants";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import type { InputEntryFunctionData } from "@aptos-labs/ts-sdk";

type Invite = {
  walletAddress: string;
  walletName: string;
  actor: string;
  timestamp: string;
};

export function InvitesPage() {
  const { account, signAndSubmitTransaction } = useWallet();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [status, setStatus] = useState("Loading...");
  const [expandedWallets, setExpandedWallets] = useState<Set<string>>(new Set());

  const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));

  useEffect(() => {
    if (!account) {
      setInvites([]);
      setStatus("Connect your wallet to see invites.");
      return;
    }

    const fetchInvites = async () => {
      setStatus("Loading...");
      try {
        const res = await fetch(`${API_BASE}/event/invites/${account.address}`);
        if (!res.ok) throw new Error("Failed to fetch invites");

        const data: Invite[] = await res.json();
        setInvites(data);
        setStatus(data.length > 0 ? "" : "You have no pending invites.");
      } catch (e) {
        console.error(e);
        setInvites([]);
        setStatus("Error fetching invites.");
      }
    };

    fetchInvites();
  }, [account]);

  // Тогл розгортання/згортання адреси
  const toggleExpand = (address: string) => {
    setExpandedWallets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(address)) newSet.delete(address);
      else newSet.add(address);
      return newSet;
    });
  };

  // Формуємо рядок для відображення
  const renderWalletLabel = (invite: Invite) => {
    const isExpanded = expandedWallets.has(invite.walletAddress);
    const shortAddress = invite.walletAddress.slice(0, 7) + "...";
    return `${invite.walletName}(${isExpanded ? invite.walletAddress : shortAddress})`;
  };

  return (
    <div style={s.container}>
      <h2 style={s.title}>My Invites</h2>

      <div style={s.formStack}>
        {status && <p style={s.statusText}>{status}</p>}

        {invites.length > 0 && (
          <ul style={{ paddingLeft: 20 }}>
            {invites.map((invite, index) => (
              <li key={index} style={{ marginBottom: 12 }}>
                <div
                  style={{ ...s.statusText, cursor: "pointer", textDecoration: "underline" }}
                  onClick={() => toggleExpand(invite.walletAddress)}
                >
                  <strong>Wallet:</strong> {renderWalletLabel(invite)}
                </div>

                <div style={s.statusText}>
                  <strong>From:</strong> {invite.actor}
                </div>

                <div style={s.statusText}>
                  <strong>Sent at:</strong>{" "}
                  {new Date(invite.timestamp).toLocaleString()}
                </div>

                <div style={{ marginTop: 6 }}>
                  <button
                    style={{ marginRight: 8 }}
                    onClick={async () => {
                      if (!account) return;
                      try {
                        setStatus("Submitting transaction...");
                        const payload: InputEntryFunctionData = {
                          function: `${MULTISIG_MODULE}::respond_to_invitation`,
                          typeArguments: [],
                          functionArguments: [invite.walletAddress, true],
                        };
                        const response = await signAndSubmitTransaction({ data: payload });
                        await aptos.waitForTransaction({ transactionHash: response.hash });
                        setStatus("Invite accepted.");
                        setInvites(prev => prev.filter(i => i.walletAddress !== invite.walletAddress));
                      } catch (err) {
                        console.error(err);
                        setStatus("Transaction failed.");
                      }
                    }}
                  >
                    Confirm
                  </button>

                  <button
                    onClick={async () => {
                      if (!account) return;
                      try {
                        setStatus("Submitting transaction...");
                        const payload: InputEntryFunctionData = {
                          function: `${MULTISIG_MODULE}::respond_to_invitation`,
                          typeArguments: [],
                          functionArguments: [invite.walletAddress, false],
                        };
                        const response = await signAndSubmitTransaction({ data: payload });
                        await aptos.waitForTransaction({ transactionHash: response.hash });
                        setStatus("Invite rejected.");
                        setInvites(prev => prev.filter(i => i.walletAddress !== invite.walletAddress));
                      } catch (err) {
                        console.error(err);
                        setStatus("Transaction failed.");
                      }
                    }}
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}