import React, { useState, useEffect } from "react";
import { profileStyles as s } from "../styles/componentStyles";
import { API_BASE } from "../constants";
import { useNavigate } from "react-router-dom";
import { hexToString } from "../utils/aptosHelpers";
import { fetchNicknameByAddress } from "../utils/userHelpers";

const AddressLabel = ({ 
  addr, 
  name, 
  isBold = false 
}: { 
  addr: string, 
  name: string | null, 
  isBold?: boolean 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const shortAddr = `${addr.slice(0, 7)}...${addr.slice(-4)}`;
  const displayAddr = isExpanded ? addr : shortAddr;

  return (
    <span 
      onClick={(e) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
      }} 
      style={{ 
        cursor: "pointer", 
        textDecoration: "underline", 
        fontWeight: isBold ? "bold" : "normal" 
      }}
    >
      {name ? `${name} (${displayAddr})` : displayAddr}
    </span>
  );
};

interface CharityWallet {
  walletAddress: string;
  walletName: string;
  admin: string;
  timestamp: string;
}

export function CharityWalletsPage() {
  const [charityWallets, setCharityWallets] = useState<CharityWallet[]>([]);
  const [status, setStatus] = useState("Loading...");
  const [nicknames, setNicknames] = useState<Record<string, string>>({});
  
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

        const adminAddresses = Array.from(new Set(data.map(w => w.admin)));
        adminAddresses.forEach(async (addr) => {
          if (!nicknames[addr]) {
            const nick = await fetchNicknameByAddress(addr);
            if (nick) {
              setNicknames(prev => ({ ...prev, [addr]: nick }));
            }
          }
        });

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

      <div style={{ 
        ...s.formStack, 
        maxHeight: "400px", 
        overflowY: "auto", 
        border: "1px solid #ccc", 
        padding: 10, 
        borderRadius: 8 
      }}>
        {status && <p style={s.statusText}>{status}</p>}

        {charityWallets.map(wallet => (
          <div key={wallet.walletAddress} style={{ 
            ...s.statusText, 
            display: "flex", 
            justifyContent: "space-between", 
            padding: "10px 0", 
            borderBottom: "1px solid #eee" 
          }}>
            <div>
              <div>
                <AddressLabel 
                  addr={wallet.walletAddress} 
                  name={hexToString(wallet.walletName)} 
                  isBold={true} 
                />
              </div>

              <small style={{ display: "block", marginTop: 4 }}>
                Admin: 
                <span style={{ marginLeft: 5, color: "#666" }}>
                  <AddressLabel 
                    addr={wallet.admin} 
                    name={nicknames[wallet.admin] || null} 
                  />
                </span>
              </small>
              
              <small style={{ display: "block", color: "#999" }}>
                Initialized: {new Date(wallet.timestamp).toLocaleString()}
              </small>
            </div>

            <button 
              style={{ alignSelf: "center" }} 
              onClick={() => navigate(`/wallet/${wallet.walletAddress}`)}
            >
              Open
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}