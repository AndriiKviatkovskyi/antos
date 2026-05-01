import React, { useState, useEffect } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { profileStyles as s } from "../styles/componentStyles";
import { API_BASE, MULTISIG_MODULE } from "../constants";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import type { InputEntryFunctionData } from "@aptos-labs/ts-sdk";
import { fetchNicknameByAddress } from "../utils/userHelpers";
import { hexToString } from "../utils/aptosHelpers";

const AddressLabel = ({ 
  addr, 
  nicknames 
}: { 
  addr: string, 
  nicknames: Record<string, string> 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const nick = nicknames[addr];

  const shortAddr = `${addr.slice(0, 7)}...${addr.slice(-4)}`;
  const displayAddr = isExpanded ? addr : shortAddr;

  if (nick) {
    return (
      <span 
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }} 
        style={{ cursor: "pointer", textDecoration: "underline" }}
        title="Click to toggle full address"
      >
        {nick} ({displayAddr})
      </span>
    );
  }

  return <span>{addr}</span>;
};

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
  const [nicknames, setNicknames] = useState<Record<string, string>>({});

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

  useEffect(() => {
    if (invites.length > 0) {
      const addressesToFetch = new Set<string>();
      invites.forEach((inv) => {
        addressesToFetch.add(inv.actor);
        addressesToFetch.add(inv.walletAddress);
      });

      addressesToFetch.forEach(async (addr) => {
        if (!nicknames[addr]) {
          const nick = await fetchNicknameByAddress(addr);
          if (nick) {
            setNicknames((prev) => ({ ...prev, [addr]: nick }));
          }
        }
      });
    }
  }, [invites]);

  const handleResponse = async (walletAddress: string, accept: boolean) => {
    if (!account) return;
    try {
      setStatus("Submitting transaction...");
      const payload: InputEntryFunctionData = {
        function: `${MULTISIG_MODULE}::respond_to_invitation`,
        typeArguments: [],
        functionArguments: [walletAddress, accept],
      };
      const response = await signAndSubmitTransaction({ data: payload });
      await aptos.waitForTransaction({ transactionHash: response.hash });
      
      setStatus(accept ? "Invite accepted." : "Invite rejected.");
      setInvites(prev => prev.filter(i => i.walletAddress !== walletAddress));
    } catch (err) {
      console.error(err);
      setStatus("Transaction failed.");
    }
  };

  return (
    <div style={s.container}>
      <h2 style={s.title}>My Invites</h2>

      <div style={s.formStack}>
        {status && <p style={s.statusText}>{status}</p>}

        {invites.length > 0 && (
          <ul style={{ paddingLeft: 0, listStyle: "none" }}>
            {invites.map((invite, index) => {
              // Декодуємо назву гаманця, якщо вона в HEX
              const decodedWalletName = hexToString(invite.walletName);

              return (
                <li key={index} style={{ 
                  marginBottom: 16, 
                  padding: "16px", 
                  border: "1px solid #eee", 
                  borderRadius: "8px",
                  background: "#f9f9f9" 
                }}>
                  <div style={s.statusText}>
                    <strong>Wallet:</strong> {decodedWalletName} (
                    <AddressLabel addr={invite.walletAddress} nicknames={nicknames} />
                    )
                  </div>

                  <div style={s.statusText}>
                    <strong>From:</strong> <AddressLabel addr={invite.actor} nicknames={nicknames} />
                  </div>

                  <div style={s.statusText}>
                    <strong>Sent at:</strong>{" "}
                    {new Date(invite.timestamp).toLocaleString()}
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <button
                      style={{ 
                        marginRight: 8,
                        backgroundColor: "#4CAF50",
                        color: "white",
                        padding: "6px 12px",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer"
                      }}
                      onClick={() => handleResponse(invite.walletAddress, true)}
                    >
                      Confirm
                    </button>

                    <button
                      style={{ 
                        backgroundColor: "#f44336",
                        color: "white",
                        padding: "6px 12px",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer"
                      }}
                      onClick={() => handleResponse(invite.walletAddress, false)}
                    >
                      Reject
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}