import { dashboardStyles as s } from "../styles/componentStyles";
 
export function Dashboard() {
  return (
    <div style={s.card}>
      <h3 style={s.label}>About</h3>
      <p style={s.aboutText}>
        Antos is a multi-signature wallet platform for Aptos. It lets you initialize new multisig
        wallets, collect signatures and execute transactions, and manage configurations — including
        participant lists, blacklists, voting thresholds, and spending limits.
      </p>
    </div>
  );
}
 