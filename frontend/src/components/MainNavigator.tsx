import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Onboarding } from "./Onboarding";
import { Navbar } from "./Navbar";
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import { mainStyles as s } from "../styles/componentStyles";
import { API_BASE } from "../constants";

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
        const res = await fetch(`${API_BASE}/user/${account?.address}`);
        if (res.ok) setProfileStatus("exists");
        else setProfileStatus("no_profile");
      } catch {
        setProfileStatus("no_profile");
      }
    };

    if (account) checkProfile();
  }, [connected, account]);

  if (!connected) {
    return (
      <div style={s.welcomeWrapper}>
        <div style={s.welcomeContainer}>
          <div style={s.logoBox}>
            <img src="/antos_logo.png" alt="Antos" style={{ maxHeight: "100%", maxWidth: "100%" }} />
          </div>
          <h1 style={s.titleSmall}>Secure your assets, make collective decisions, configure spending </h1>
          <div style={s.walletSelectorWrapper}>
            <WalletSelector />
          </div>
        </div>
      </div>
    );
  }

  if (profileStatus === "loading") {
    return <div style={s.loadingText}>Syncing Profile...</div>;
  }

  if (profileStatus === "no_profile") {
    return <Onboarding onComplete={() => setProfileStatus("exists")} />;
  }

  return (
    <div style={s.pageWrapper}>
      <Navbar address={account?.address.toString() || ""} />
      <main style={s.contentMain}>
        <Outlet />
      </main>
    </div>
  );
}