import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useState, useEffect } from "react";
import { Onboarding } from "./Onboarding.js";
import { Dashboard } from "./Dashboard.js";
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";

export function MainNavigator() {
  const { account, connected, disconnect } = useWallet();
  const [profileStatus, setProfileStatus] = useState<"loading" | "no_profile" | "exists">("loading");

  useEffect(() => {
    if (connected && account) {
      // Check backend for profile
      fetch(`http://localhost:3001/api/user/${account.address}`)
        .then((res) => {
          if (res.ok) setProfileStatus("exists");
          else setProfileStatus("no_profile");
        })
        .catch(() => setProfileStatus("no_profile"));
    }
  }, [connected, account]);

  // SCREEN 1: Not connected
  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <h1 className="text-4xl font-black mb-8 text-blue-900">Aptos Multisig</h1>
        <div className="p-4 bg-white shadow-xl rounded-2xl">
          <WalletSelector />
        </div>
      </div>
    );
  }

  if (profileStatus === "loading") return <div className="p-10">Syncing with Movement...</div>;

  // SCREEN 2: Connected but no nickname
  if (profileStatus === "no_profile") {
    return <Onboarding onComplete={() => setProfileStatus("exists")} />;
  }

  // SCREEN 3: Full Access
  return (
  <div className="min-h-screen bg-gray-100">
    <nav className="flex justify-between items-center p-6 bg-white border-b">
      <h1 className="text-xl font-bold text-blue-600">Dashboard</h1>
      <button onClick={disconnect}>Disconnect</button>
    </nav>
    <main className="p-8">
      {/* Explicitly call .toString() to satisfy the string type requirement */}
      <Dashboard address={account!.address.toString()} />
    </main>
  </div>
);
}