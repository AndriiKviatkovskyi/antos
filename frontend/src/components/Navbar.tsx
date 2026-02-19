import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Aptos, AptosConfig, Network, AccountAddress } from "@aptos-labs/ts-sdk";
import { navStyles as s } from "../styles/componentStyles";

const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));

export function Navbar({ address }: { address: string }) {
  const { disconnect } = useWallet();
  const [balance, setBalance] = useState("...");
  const location = useLocation();

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const amount = await aptos.getAccountAPTAmount({ 
          accountAddress: AccountAddress.from(address) 
        });
        setBalance((Number(amount) / 100_000_000).toFixed(2));
      } catch { 
        setBalance("0.00"); 
      }
    };
    fetchBalance();
  }, [address]);

  // Helper to determine active link styling
  const getLinkStyle = (path: string) => {
  const isActive = location.pathname === path;
  
  return {
    ...s.linkBase,
    ...(isActive ? s.linkActive : s.linkInactive)
  };
  };

  return (
    <nav style={s.wrapper}>
      <div style={s.container}>
        <div style={s.leftSection}>
          <Link to="/" style={s.logo}>LOGO</Link>
          
          <div style={s.linkGroup}>
            <Link to="/myprofile" style={getLinkStyle("/myprofile")}>
              My Profile
            </Link>
            <Link to="/mywallets" style={getLinkStyle("/mywallets")}>
              My Wallets
            </Link>
            <Link to="/createwallet" style={getLinkStyle("/createwallet")}>
              Create Wallet
            </Link>
            <Link to="/invites" style={getLinkStyle("/invites")}>
              Invites
            </Link>
            <Link to="/charity-wallets" style={getLinkStyle("/charity-wallets")}>
              Charity Wallets
            </Link>
          </div>
        </div>

        <div style={s.rightSection}>
          <div style={s.balanceBadge}>
            {balance} APT
          </div>
          
          <button onClick={disconnect} style={s.logoutBtn}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
}