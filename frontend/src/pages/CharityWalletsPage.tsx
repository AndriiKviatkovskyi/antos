import { useState, useEffect } from "react";
import { profileStyles as s } from "../styles/componentStyles";
import { API_BASE } from "../constants";
import { useNavigate } from "react-router-dom";

interface CharityWallet {
  walletAddress: string;
  admin: string;
  timestamp: string;
}

export function CharityWalletsPage() {
  const [charityWallets, setCharityWallets] = useState<CharityWallet[]>([]);
  const [status, setStatus] = useState("Loading...");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCharityWallets = async () => {
      setStatus("Loading...");
      try {
        const res = await fetch(`${API_BASE}/event/charity-wallets`);
        if (!res.ok) throw new Error("Failed to fetch charity wallets");
        const data: CharityWallet[] = await res.json();

        setCharityWallets(data);
        setStatus(data.length > 0 ? "" : "No charity wallets found.");
      } catch (e) {
        console.error(e);
        setCharityWallets([]);
        setStatus("Error fetching charity wallets.");
      }
    };

    fetchCharityWallets();
  }, []);

  return (
    <div style={s.container}>
      <h2 style={s.title}>Charity Wallets</h2>

      <div
        style={{
          ...s.formStack,
          maxHeight: "400px", // scrollable height
          overflowY: "auto",
          border: "1px solid #ccc",
          padding: 10,
          borderRadius: 8,
        }}
      >
        {status && <p style={s.statusText}>{status}</p>}

        {charityWallets.length > 0 && (
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            {charityWallets.map(wallet => (
              <li
                key={wallet.walletAddress}
                style={{
                  ...s.statusText,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "6px 0",
                  borderBottom: "1px solid #eee",
                }}
              >
                <div>
                  <strong>{wallet.walletAddress}</strong> <br />
                  <small>Admin: {wallet.admin}</small> <br />
                  <small>
                    Initialized: {new Date(wallet.timestamp).toLocaleString()}
                  </small>
                </div>

                <button
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
