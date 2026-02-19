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
}) => {
  const [showOwners, setShowOwners] = useState(false);

  return (
    <div style={s.walletBox}>
      <div
        style={{
          ...s.walletHeader,
          ...(walletData.is_charity
            ? s.walletHeaderCharity
            : s.walletHeaderNormal),
        }}
      >
        <div>
          <div style={s.walletName}>{walletData.name}</div>
          <div style={s.walletAddress}>{address}</div>
        </div>
      </div>

      <div style={s.walletBody}>
        <div>Apt Balance: {balance ? `${formatApt(balance)} APT` : "N/A"}</div>

        <div style={s.ownersHeader} onClick={() => setShowOwners(!showOwners)}>
          {showOwners ? "▼" : "▶"} Owners (
          {walletData.owners.length}/{walletData.max_owners})
        </div>

        {showOwners && (
          <ul style={s.ownersList}>
            {walletData.owners.map((owner: string) => {
              const ownerIsAdmin = walletData.admins.includes(owner);

              const canKick =
                isAdmin &&
                !ownerIsAdmin &&
                owner.toLowerCase() !== currentUserHex?.toLowerCase();

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
                </li>
              );
            })}
          </ul>
        )}

        {isOwner && (
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
        )}
      </div>
    </div>
  );
};
