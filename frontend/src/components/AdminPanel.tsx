import React from "react";

interface AdminPanelProps {
  isAdmin: boolean;
  styles: any;
  setShowInviteModal: (show: boolean) => void;
  openGovernanceModal: () => void;
  openListsModal: () => void;
  openUpdateLimitsModal: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isAdmin,
  styles: s,
  setShowInviteModal,
  openGovernanceModal,
  openListsModal,
  openUpdateLimitsModal,
}) => {
  return (
    <div style={s.sideBox}>
      <div style={s.sideHeader}>Admin Functions</div>
      <div style={s.sideBody}>
        {isAdmin ? (
          <>
            <button style={s.primaryButton} onClick={() => setShowInviteModal(true)}>
              Invite user
            </button>
            <div style={{ height: 12 }} />

            <button style={s.primaryButton} onClick={openGovernanceModal}>
              Governance config
            </button>
            <div style={{ height: 12 }} />

            <button style={s.primaryButton} onClick={openListsModal}>
              Manage Lists
            </button>
            <div style={{ height: 12 }} />

            <button style={s.primaryButton} onClick={openUpdateLimitsModal}>
              Update Limits
            </button>
          </>
        ) : (
          <p>Sorry, you're not this wallet's admin</p>
        )}
      </div>
    </div>
  );
};
