import { useEffect, useState } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Aptos, AptosConfig, Network, AccountAddress } from "@aptos-labs/ts-sdk";
import { dashboardStyles as s } from "../styles/componentStyles";

const config = new AptosConfig({ network: Network.TESTNET });
const aptos = new Aptos(config);

export function Dashboard() {
  const { account } = useWallet();
  const [balance, setBalance] = useState<string>("...");

  const addressStr = account?.address.toString();

  useEffect(() => {
    const getBalance = async () => {
      if (!addressStr) return;
      
      try {
        const amount = await aptos.getAccountAPTAmount({ 
          accountAddress: AccountAddress.from(addressStr) 
        });
        setBalance((Number(amount) / 100_000_000).toFixed(4));
      } catch (e) {
        console.error("Balance fetch error:", e);
        setBalance("0.0000");
      }
    };
    getBalance();
  }, [addressStr]);

  return (
    <div style={s.card}>
      <h3 style={s.label}>Devnet Balance</h3>
      <p style={s.balanceText}>
        {balance}
        <span style={s.unit}>APT</span>
      </p>
    </div>
  );
}