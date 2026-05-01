import { useState, useEffect } from "react";
import { profileStyles as s } from "../styles/componentStyles";
import { API_BASE } from "../constants";
import { useNavigate } from "react-router-dom";
import { hexToString } from "../utils/aptosHelpers";
import { fetchNicknameByAddress } from "../utils/userHelpers";

interface CharityWallet {
  walletAddress: string;
  walletName: string;
  admin: string;
  timestamp: string;
}

export function CharityWalletsPage() {
  const [charityWallets, setCharityWallets] = useState<CharityWallet[]>([]);
  const [status, setStatus] = useState("Loading...");
  const [expandedWallets, setExpandedWallets] = useState<Set<string>>(new Set());
  const [expandedAdmins, setExpandedAdmins] = useState<Set<string>>(new Set()); // Тогл для адмінів
  const [nicknames, setNicknames] = useState<Record<string, string>>({}); // Сховище нікнеймів
  
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

        // Питаємо нікнейми для всіх унікальних адмінів
        const adminAddresses = Array.from(new Set(data.map(w => w.admin)));
        adminAddresses.forEach(async (addr) => {
          const nick = await fetchNicknameByAddress(addr);
          if (nick) {
            setNicknames(prev => ({ ...prev, [addr]: nick }));
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

  const toggleExpand = (address: string, isWallet: boolean) => {
    const setter = isWallet ? setExpandedWallets : setExpandedAdmins;
    setter(prev => {
      const newSet = new Set(prev);
      if (newSet.has(address)) newSet.delete(address);
      else newSet.add(address);
      return newSet;
    });
  };

  const renderLabel = (address: string, name: string | null, isExpanded: boolean) => {
    const shortAddress = address.slice(0, 7) + "...";
    const displayAddress = isExpanded ? address : shortAddress;
    
    // Якщо ім'я є, виводимо "Name (Address)", якщо немає — просто "Address"
    return name 
      ? `${name} (${displayAddress})` 
      : displayAddress;
  };

  return (
    <div style={s.container}>
      <h2 style={s.title}>Charity Wallets</h2>

      <div style={{ ...s.formStack, maxHeight: "400px", overflowY: "auto", border: "1px solid #ccc", padding: 10, borderRadius: 8 }}>
        {status && <p style={s.statusText}>{status}</p>}

        {charityWallets.map(wallet => (
          <div key={wallet.walletAddress} style={{ ...s.statusText, display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #eee" }}>
            <div>
              {/* Назва гаманця */}
              <div 
                style={{ cursor: "pointer", textDecoration: "underline", fontWeight: "bold" }}
                onClick={() => toggleExpand(wallet.walletAddress, true)}
              >
                {renderLabel(wallet.walletAddress, hexToString(wallet.walletName), expandedWallets.has(wallet.walletAddress))}
              </div>

              {/* Адмін з нікнеймом */}
              <small>
                Admin: 
                <span 
                  style={{ cursor: "pointer", marginLeft: 5, color: "#666" }} 
                  onClick={() => toggleExpand(wallet.admin, false)}
                >
                  {renderLabel(wallet.admin, nicknames[wallet.admin], expandedAdmins.has(wallet.admin))}
                </span>
              </small> 
              <br />
              <small>Initialized: {new Date(wallet.timestamp).toLocaleString()}</small>
            </div>

            <button onClick={() => navigate(`/wallet/${wallet.walletAddress}`)}>Open</button>
          </div>
        ))}
      </div>
    </div>
  );
}