import { useEffect, useState } from "react";
import { Aptos, AptosConfig, Network, AccountAddress } from "@aptos-labs/ts-sdk";

const config = new AptosConfig({ network: Network.DEVNET });
const aptos = new Aptos(config);

// Ensure the interface says 'string'
interface DashboardProps {
  address: string; 
}

export function Dashboard({ address }: DashboardProps) {
  const [balance, setBalance] = useState<string>("...");

  useEffect(() => {
    const getBalance = async () => {
      try {
        // We wrap the string 'address' in AccountAddress.from() here
        const amount = await aptos.getAccountAPTAmount({ 
          accountAddress: AccountAddress.from(address) 
        });
        setBalance((Number(amount) / 100_000_000).toFixed(4));
      } catch (e) {
        console.error("Balance fetch error:", e);
        setBalance("0.0000");
      }
    };
    getBalance();
  }, [address]);

  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
      <h3 className="text-gray-400 text-xs font-black uppercase">Devnet Balance</h3>
      <p className="text-5xl font-mono">{balance} APT</p>
    </div>
  );
}