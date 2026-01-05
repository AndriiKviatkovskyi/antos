import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useState, useEffect } from "react";
import { Onboarding } from "./Onboarding";
import { Dashboard } from "./Dashboard";
import { Navbar } from "./Navbar.js";
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";

export function MainNavigator() {
  const { account, connected } = useWallet();
  const [profileStatus, setProfileStatus] = useState<"loading" | "no_profile" | "exists">("loading");

  useEffect(() => {
    if (!connected) {
      setProfileStatus("loading"); // Reset state when wallet disconnects
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

  // 1. WELCOME SCREEN (Not Connected)
  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
        <div className="max-w-md space-y-6">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl mx-auto shadow-2xl shadow-blue-200 flex items-center justify-center">
             <span className="text-white text-3xl font-black">A</span>
          </div>
          <h1 className="text-5xl font-black text-slate-900 leading-tight">Secure your assets on Movement.</h1>
          <p className="text-slate-500 text-lg">Connect your wallet to manage your multisig and profile.</p>
          <div className="inline-block p-2 bg-white rounded-2xl shadow-xl border border-slate-100">
            <WalletSelector />
          </div>
        </div>
      </div>
    );
  }

  if (profileStatus === "loading") return <div className="p-10 text-center animate-pulse">Syncing Profile...</div>;

  // 2. ONBOARDING (Connected but no profile)
  if (profileStatus === "no_profile") {
    return <Onboarding onComplete={() => setProfileStatus("exists")} />;
  }

  // 3. HOMEPAGE (Connected and Profile Exists)
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar address={account?.address.toString() || ""} />
      <main className="max-w-7xl mx-auto p-6 lg:p-12">
        <Dashboard address={account?.address.toString() || ""} />
      </main>
    </div>
  );
}