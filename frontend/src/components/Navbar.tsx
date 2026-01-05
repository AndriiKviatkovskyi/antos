import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useEffect, useState } from "react";
import { Aptos, AptosConfig, Network, AccountAddress } from "@aptos-labs/ts-sdk";

const aptos = new Aptos(new AptosConfig({ network: Network.DEVNET }));

export function Navbar({ address }: { address: string }) {
  const { disconnect } = useWallet();
  const [balance, setBalance] = useState("...");

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const amount = await aptos.getAccountAPTAmount({ 
          accountAddress: AccountAddress.from(address) 
        });
        setBalance((Number(amount) / 100_000_000).toFixed(2));
      } catch (e) { setBalance("0.00"); }
    };
    fetchBalance();
  }, [address]);

  return (
    <nav className="sticky top-4 z-50 mx-auto max-w-7xl px-4">
      <div className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg rounded-3xl p-4 flex justify-between items-center px-8">
        <div className="flex items-center gap-8">
          <div className="text-blue-600 font-black text-xl cursor-pointer">LOGO</div>
          <div className="hidden md:flex gap-6 text-sm font-bold text-slate-600">
            <button className="hover:text-blue-600 transition-colors">My Profile</button>
            <button className="text-slate-300 cursor-not-allowed">My Wallets</button>
            <button className="text-slate-300 cursor-not-allowed">Charity</button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
            <span className="text-xs font-black text-blue-400 block uppercase">Balance</span>
            <span className="text-blue-700 font-mono font-bold leading-tight">{balance} APT</span>
          </div>
          <button onClick={disconnect} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
          </button>
        </div>
      </div>
    </nav>
  );
}