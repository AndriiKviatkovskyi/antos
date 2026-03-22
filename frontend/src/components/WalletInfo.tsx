import React, { useState } from "react";

interface WalletInfoProps {
  walletData: any;
  address?: string;
  balance?: number | null;
  currentUserHex?: string;
  isOwner: boolean;
  isAdmin: boolean;
  formatApt: (amount: number) => string;
  styles: any;
  onShowProposeModal: () => void;
  onShowProposalsModal: () => void;
  setOwnerToKick: (owner: string) => void;
  setShowKickModal: (show: boolean) => void;
  joinCharityWallet: () => void;
  setOwnerToPromote: (owner: string) => void;
  setShowPromoteModal: (show: boolean) => void;
}

export const WalletInfo: React.FC<WalletInfoProps> = ({
  walletData,
  address,
  balance,
  currentUserHex,
  isOwner,
  isAdmin,
  formatApt,
  styles: s,
  onShowProposeModal,
  onShowProposalsModal,
  setOwnerToKick,
  setShowKickModal,
  joinCharityWallet,
  setOwnerToPromote,
  setShowPromoteModal,
}) => {
  const [showOwners, setShowOwners] = useState(false);

  if (!isOwner) {
    if (walletData.wallet_mode === 2) {
      return (
        <div style={s.walletBox}>
          <div
            style={{
              ...s.walletHeader,
              ...s.walletHeaderCharity,
            }}
          >
            <div>
              <div style={s.walletName}>{walletData.name}</div>
              <div style={s.walletAddress}>{address}</div>
            </div>
          </div>

          <div style={{ padding: 16, textAlign: "center" }}>
            <button
              style={{
                ...s.primaryButton,
                backgroundColor: "#22c55e", // green
                color: "white",
                padding: "10px 20px",
                fontSize: "16px",
                cursor: "pointer",
              }}
              onClick={joinCharityWallet}
            >
              Join Charity Wallet
            </button>
          </div>
        </div>
      );
    }

    return (
      <div style={s.walletBox}>
        <div
          style={{
            ...s.walletHeader,
            ...(
              walletData.wallet_mode === 1
              ? s.walletHeaderSafe
              : s.walletHeaderNormal
            ),
          }}
        >
          <div>
            <div style={s.walletName}>{walletData.name}</div>
            <div style={s.walletAddress}>{address}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.walletBox}>
      <div
        style={{
          ...s.walletHeader,
          ...(
            walletData.wallet_mode === 2
              ? s.walletHeaderCharity
              : walletData.wallet_mode === 1
              ? s.walletHeaderSafe
              : s.walletHeaderNormal
          ),
        }}
      >
        <div>
          <div style={s.walletName}>{walletData.name}</div>
          <div style={s.walletAddress}>{address}</div>
        </div>
      </div>

      <div style={s.walletBody}>
        {/* Balance */}
        <div>Apt Balance: {balance ? `${formatApt(balance)} APT` : "N/A"}</div>

        {/* Owners list */}
        <div style={s.ownersHeader} onClick={() => setShowOwners(!showOwners)}>
          {showOwners ? "▼" : "▶"} Owners (
          {walletData.owners.length}/{walletData.max_owners})
        </div>

        {showOwners && (
          <ul style={s.ownersList}>
            {walletData.owners.map((owner: string) => {
              const ownerIsAdmin = walletData.admins.includes(owner);
              const isSelf =
                owner.toLowerCase() === currentUserHex?.toLowerCase();

              const canKick = isAdmin && !ownerIsAdmin && !isSelf && walletData.wallet_mode !== 2;

              const canPromote =
                isAdmin &&
                !ownerIsAdmin &&
                !isSelf &&
                walletData.wallet_mode !== 1;

              return (
                <li
                  key={owner}
                  style={{
                    ...s.ownerItem,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>
                    {owner}
                    {ownerIsAdmin && <span style={s.adminStar}>★</span>}
                  </span>

                  {(canKick || canPromote) && (
                    <div style={{ display: "flex", gap: "6px" }}>
                      
                      {canPromote && (
                        <button
                          style={{
                            ...s.secondaryButton,
                            backgroundColor: "#dcfce7",
                            border: "1px solid #16a34a",
                            color: "#166534",
                            padding: "4px 10px",
                            fontSize: "12px",
                          }}
                          onClick={() => {
                            setOwnerToPromote(owner);
                            setShowPromoteModal(true);
                          }}
                        >
                          Promote
                        </button>
                      )}

                      {canKick && (
                        <button
                          style={{
                            ...s.secondaryButton,
                            backgroundColor: "#fee2e2",
                            border: "1px solid #ef4444",
                            color: "#b91c1c",
                            padding: "4px 10px",
                            fontSize: "12px",
                          }}
                          onClick={() => {
                            setOwnerToKick(owner);
                            setShowKickModal(true);
                          }}
                        >
                          Kick
                        </button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {/* Proposal buttons */}
        <div style={{ marginTop: 16 }}>
          <button
            style={{
              ...s.primaryButton,
              opacity: walletData.only_admins_can_initiate && !isAdmin ? 0.5 : 1,
              cursor:
                walletData.only_admins_can_initiate && !isAdmin
                  ? "not-allowed"
                  : "pointer",
            }}
            disabled={walletData.only_admins_can_initiate && !isAdmin}
            onClick={onShowProposeModal}
          >
            Initiate Proposal
          </button>

          <button style={s.secondaryButton} onClick={onShowProposalsModal}>
            View Proposals
          </button>

          {walletData.only_admins_can_initiate && !isAdmin && (
            <p style={s.errorText}>Only admins can initiate proposals.</p>
          )}
        </div>
      </div>
    </div>
  );
};
