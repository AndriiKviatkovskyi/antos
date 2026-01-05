import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Onboarding } from "./Onboarding";
import { Navbar } from "./Navbar";
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import { mainStyles as s } from "../styles/componentStyles"; // Importing styles

export function MainNavigator() {
  const { account, connected } = useWallet();
  const [profileStatus, setProfileStatus] = useState<"loading" | "no_profile" | "exists">("loading");

  useEffect(() => {
    if (!connected) {
      setProfileStatus("loading");
      return;
    }

    const checkProfile = async () => {
      try {
        const res = await fetch(`http://localhost:3001/api/user/${account?.address}`);
        if (res.ok) setProfileStatus("exists");
        else setProfileStatus("no_profile");
      } catch {
        setProfileStatus("no_profile");
      }
    };

    if (account) checkProfile();
  }, [connected, account]);

  // SCREEN 1: DISCONNECTED
  if (!connected) {
    return (
      <div style={s.welcomeWrapper}>
        <div style={s.welcomeContainer}>
          <div style={s.logoBox}>A logo</div>
          <h1 style={s.title}>Secure your assets.</h1>
          <div style={s.walletSelectorWrapper}>
            <WalletSelector />
          </div>
        </div>
      </div>
    );
  }

  // SCREEN 2: LOADING
  if (profileStatus === "loading") {
    return <div style={s.loadingText}>Syncing Profile...</div>;
  }

  // SCREEN 3: ONBOARDING
  if (profileStatus === "no_profile") {
    return <Onboarding onComplete={() => setProfileStatus("exists")} />;
  }

  // SCREEN 4: AUTHENTICATED LAYOUT
  return (
    <div style={s.pageWrapper}>
      <Navbar address={account?.address.toString() || ""} />
      <main style={s.contentMain}>
        <Outlet />
      </main>
    </div>
  );
}