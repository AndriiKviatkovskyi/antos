import { useState, useEffect } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Aptos, AptosConfig, Network, AccountAddress } from "@aptos-labs/ts-sdk";
import { profileStyles as s, dashboardStyles as ds } from "../styles/componentStyles";
import { API_BASE } from "../constants";

const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));

export function ProfilePage() {
  const { account } = useWallet();
  const [form, setForm] = useState({ nickname: "", bio: "", pfp: "" });
  const [status, setStatus] = useState("");
  const [balance, setBalance] = useState("...");

  const addressStr = account?.address.toString();

  useEffect(() => {
    if (!account) return;

    fetch(`${API_BASE}/user/${account.address}`)
      .then(res => res.json())
      .then(data => setForm({
        nickname: data.nickname || "",
        bio: data.bio || "",
        pfp: data.pfp || "",
      }));
  }, [account]);

  useEffect(() => {
    if (!addressStr) return;
    const fetchBalance = async () => {
      try {
        const amount = await aptos.getAccountAPTAmount({
          accountAddress: AccountAddress.from(addressStr),
        });
        setBalance((Number(amount) / 100_000_000).toFixed(4));
      } catch {
        setBalance("0.0000");
      }
    };
    fetchBalance();
  }, [addressStr]);

  const handleUpdate = async () => {
    setStatus("Saving...");
    try {
      const res = await fetch(`${API_BASE}/user/${account?.address}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setStatus(res.ok ? "Profile updated!" : "Update failed.");
    } catch {
      setStatus("Server error.");
    }
  };

  return (
    <div style={s.container}>

      {/* Balance */}
      <div style={s.balanceCard}>
        <p style={ds.label}>Balance</p>
        <p style={ds.balanceText}>
          {balance}
          <span style={ds.unit}>APT</span>
        </p>
      </div>

      <h2 style={s.title}>Profile Settings</h2>

      <div style={s.formStack}>
        <div style={s.avatarSection}>
          <div style={s.avatarBox}>
            {form.pfp && <img src={form.pfp} style={s.avatarImg} alt="Profile" />}
          </div>
          <input
            style={s.pfpInput}
            placeholder="PFP URL"
            value={form.pfp}
            onChange={e => setForm({ ...form, pfp: e.target.value })}
          />
        </div>

        <input
          style={s.input}
          placeholder="Nickname"
          value={form.nickname}
          onChange={e => setForm({ ...form, nickname: e.target.value })}
        />

        <textarea
          style={s.textarea}
          placeholder="Bio"
          value={form.bio}
          onChange={e => setForm({ ...form, bio: e.target.value })}
        />

        <button onClick={handleUpdate} style={s.submitBtn}>
          Save Changes
        </button>

        {status && <p style={s.statusText}>{status}</p>}
      </div>
    </div>
  );
}