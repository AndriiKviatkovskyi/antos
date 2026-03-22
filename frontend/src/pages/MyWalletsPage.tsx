import { useState, useEffect } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { profileStyles as s } from "../styles/componentStyles"; 
import { API_BASE } from "../constants";
import { useNavigate } from "react-router-dom";

interface WalletInfo {
  walletAddress: string;
  walletName: string;
}

export function MyWalletsPage() {
  const { account } = useWallet();
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [status, setStatus] = useState("Loading...");
  const [expandedWallets, setExpandedWallets] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    if (!account) {
      setWallets([]);
      setStatus("Connect your wallet to see memberships.");
      return;
    }

    const fetchWallets = async () => {
      setStatus("Loading...");
      try {
        const res = await fetch(`${API_BASE}/event/memberships/${account.address}`);
        if (!res.ok) throw new Error("Failed to fetch wallets");
        const data: WalletInfo[] = await res.json();
        setWallets(data);
        setStatus(data.length > 0 ? "" : "You are not a member of any wallets.");
      } catch (e) {
        console.error(e);
        setWallets([]);
        setStatus("Error fetching wallets.");
      }
    };

    fetchWallets();
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
  const renderWalletLabel = (wallet: WalletInfo) => {
    const isExpanded = expandedWallets.has(wallet.walletAddress);
    const shortAddress = wallet.walletAddress.slice(0, 7) + "...";
    return `${wallet.walletName}(${isExpanded ? wallet.walletAddress : shortAddress})`;
  };

  return (
    <div style={s.container}>
      <h2 style={s.title}>My Membership Wallets</h2>

      <div style={s.formStack}>
        {status && <p style={s.statusText}>{status}</p>}

        {wallets.length > 0 && (
          <ul style={{ paddingLeft: 20 }}>
            {wallets.map(wallet => (
              <li key={wallet.walletAddress} style={s.statusText}>
                <span
                  style={{ cursor: "pointer", textDecoration: "underline" }}
                  onClick={() => toggleExpand(wallet.walletAddress)}
                >
                  {renderWalletLabel(wallet)}
                </span>
                <button
                  style={{ marginLeft: 10 }}
                  onClick={() => navigate(`/wallet/${wallet.walletAddress}`)}
                >
                  Open
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}