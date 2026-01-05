import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Aptos, AptosConfig, Network, AccountAddress } from "@aptos-labs/ts-sdk";
import { navStyles as s } from "../styles/componentStyles";

const aptos = new Aptos(new AptosConfig({ network: Network.DEVNET }));

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
    const stateStyle = location.pathname === path ? s.linkActive : s.linkInactive;
    return `${s.linkBase} ${stateStyle}`;
  };

  return (
    <nav className={s.wrapper}>
      <div className={s.container}>
        <div className={s.leftSection}>
          <Link to="/" className={s.logo}>LOGO</Link>
          
          <div className={s.linkGroup}>
            <Link to="/myprofile" className={getLinkStyle("/myprofile")}>
              My Profile
            </Link>
            <span className={s.linkDisabled}>My Wallets</span>
            <span className={s.linkDisabled}>Charity</span>
          </div>
        </div>

        <div className={s.rightSection}>
          <div className={s.balanceBadge}>
            {balance} APT
          </div>
          
          <button onClick={disconnect} className={s.logoutBtn}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
}