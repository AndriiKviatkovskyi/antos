import React from "react";

interface AdminPanelProps {
  isAdmin: boolean;
  isCharity: boolean;
  styles: any;
  setShowInviteModal: (show: boolean) => void;
  openGovernanceModal: () => void;
  openListsModal: () => void;
  openUpdateLimitsModal: () => void;
  onShowMemberPaymentsModal: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isAdmin,
  isCharity,
  styles: s,
  setShowInviteModal,
  openGovernanceModal,
  openListsModal,
  openUpdateLimitsModal,
  onShowMemberPaymentsModal,
}) => {
  return (
    <div style={s.sideBox}>
      <div style={s.sideHeader}>Admin Functions</div>
      <div style={s.sideBody}>
        {isAdmin ? (
          <>
            {!isCharity && (
              <>
                <button
                  style={s.primaryButton}
                  onClick={() => setShowInviteModal(true)}
                >
                  Invite user
                </button>
                <div style={{ height: 12 }} />
              </>
            )}

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

            {isCharity && (
              <>
                <div style={{ height: 16 }} />
                <button
                  style={{
                    ...s.primaryButton,
                    backgroundColor: "#22c55e",
                    border: "1px solid #15803d",
                  }}
                  onClick={onShowMemberPaymentsModal}
                >
                  Member Payments
                </button>
              </>
            )}
            
          </>
        ) : (
          <p>Sorry, you're not this wallet's admin</p>
        )}
      </div>
    </div>
  );
};
