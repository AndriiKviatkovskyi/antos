import { useState, useEffect } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { profileStyles as s } from "../styles/componentStyles"; // reuse styles
import { API_BASE } from "../constants";
import { useNavigate } from "react-router-dom";

export function MyWalletsPage() {
  const { account } = useWallet();
  const [wallets, setWallets] = useState<string[]>([]);
  const [status, setStatus] = useState("Loading...");
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
        const data: string[] = await res.json();
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

  return (
    <div style={s.container}>
      <h2 style={s.title}>My Membership Wallets</h2>

      <div style={s.formStack}>
        {status && <p style={s.statusText}>{status}</p>}

        {wallets.length > 0 && (
          <ul style={{ paddingLeft: 20 }}>
            {wallets.map(wallet => (
              <li key={wallet} style={s.statusText}>
                {wallet}
                <button
                  style={{ marginLeft: 10 }}
                  onClick={() => navigate(`/wallet/${wallet}`)}
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
