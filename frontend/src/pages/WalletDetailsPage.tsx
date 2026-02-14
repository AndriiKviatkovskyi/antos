import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { walletStyles as s } from "../styles/componentStyles";
import { MULTISIG_MODULE } from "../constants";

const aptos = new Aptos(
  new AptosConfig({ network: Network.TESTNET })
);

// Convert hex → string
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

interface WalletInfo {
  name: string;
  owners: string[];
  admins: string[];
  balance: string;
  is_charity: boolean;
  entry_fee: string;
  monthly_fee: string;
  voting_mode: number;
  recipient_filter_is_whitelist: boolean;
}

export function WalletDetailsPage() {
  const { address } = useParams<{ address: string }>();
  const [walletData, setWalletData] = useState<any | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [status, setStatus] = useState("Loading...");
  const [ownersVisible, setOwnersVisible] = useState(false);

  function formatApt(octas: string | number): string {
    const apt = Number(octas) / 100_000_000; // 1 APT = 100_000_000 octas
    return apt.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 3 });
  }

  useEffect(() => {
    if (!address) return;

    const fetchData = async () => {
      try {
        setStatus("Loading...");

        // 1️⃣ Fetch MultisigStore resource
        const resource = await aptos.getAccountResource({
          accountAddress: address,
          resourceType: `${MULTISIG_MODULE}::MultisigStore` as const,
        });

        const data = resource;
        if (data.name) data.name = hexToString(data.name);

        setWalletData(data);

        // 2️⃣ Fetch wallet info (balance)
        try {
          const response = await aptos.view({
            payload: {
              function: `${MULTISIG_MODULE}::get_wallet_info`,
              typeArguments: [],
              functionArguments: [address],
            },
          });

          const rawData = response[0] as WalletInfo;
          setBalance(rawData.balance);
        } catch {
          setBalance("0");
        }

        setStatus("");
      } catch (e) {
        console.error(e);
        setStatus("Failed to fetch wallet data.");
      }
    };

    fetchData();
  }, [address]);

  const toggleOwners = () => setOwnersVisible(!ownersVisible);

  return (
    <div style={s.container}>
      {status && <p style={s.statusText}>{status}</p>}

      {walletData && (
        <div style={s.walletBox}>
          <div
            style={{
              ...s.walletHeader,
              ...(walletData.is_charity ? s.walletHeaderCharity : s.walletHeaderNormal)
            }}
          >
            <div style={s.walletHeaderLeft}>
              <span style={s.walletName}>{walletData.name || "Unnamed Wallet"}</span>
              <span style={s.walletAddress}>{address}</span>
            </div>
            {walletData.is_charity && <span style={s.walletCharityBadge}>Charity</span>}
          </div>

          <div style={s.walletBody}>
            <div style={s.balanceRow}>APT Balance: {balance !== null ? `${formatApt(balance)} APT` : "N/A"}</div>

            <div style={s.ownersSection}>
              <div style={s.ownersHeader} onClick={toggleOwners}>
                Owners {ownersVisible ? "▲" : "▼"}
              </div>
              {ownersVisible && (
                <ul style={s.ownersList}>
                  {walletData.owners.map((owner: string) => (
                    <li key={owner} style={s.ownerItem}>
                      {owner} {walletData.admins.includes(owner) && <span style={s.adminStar}>★</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
