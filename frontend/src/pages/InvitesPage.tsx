import { useState, useEffect } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { profileStyles as s } from "../styles/componentStyles";
import { API_BASE } from "../constants";

type Invite = {
  walletAddress: string;
  actor: string;
  timestamp: string;
};

export function InvitesPage() {
  const { account } = useWallet();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [status, setStatus] = useState("Loading...");

  useEffect(() => {
    if (!account) {
      setInvites([]);
      setStatus("Connect your wallet to see invites.");
      return;
    }

    const fetchInvites = async () => {
      setStatus("Loading...");
      try {
        const res = await fetch(
          `${API_BASE}/event/invites/${account.address}`
        );

        if (!res.ok) throw new Error("Failed to fetch invites");

        const data: Invite[] = await res.json();
        setInvites(data);

        setStatus(
          data.length > 0 ? "" : "You have no pending invites."
        );
      } catch (e) {
        console.error(e);
        setInvites([]);
        setStatus("Error fetching invites.");
      }
    };

    fetchInvites();
  }, [account]);

  return (
    <div style={s.container}>
      <h2 style={s.title}>My Invites</h2>

      <div style={s.formStack}>
        {status && <p style={s.statusText}>{status}</p>}

        {invites.length > 0 && (
          <ul style={{ paddingLeft: 20 }}>
            {invites.map((invite, index) => (
              <li key={index} style={{ marginBottom: 12 }}>
                <div style={s.statusText}>
                  <strong>Wallet:</strong> {invite.walletAddress}
                </div>

                <div style={s.statusText}>
                  <strong>From:</strong> {invite.actor}
                </div>

                <div style={s.statusText}>
                  <strong>Sent at:</strong>{" "}
                  {new Date(invite.timestamp).toLocaleString()}
                </div>

                <div style={{ marginTop: 6 }}>
                  <button
                    style={{ marginRight: 8 }}
                    onClick={() => {
                      // TODO: implement accept logic
                      console.log("Accepted invite:", invite.walletAddress);
                    }}
                  >
                    Confirm
                  </button>

                  <button
                    onClick={() => {
                      // TODO: implement reject logic
                      console.log("Rejected invite:", invite.walletAddress);
                    }}
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
