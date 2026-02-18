import React from "react";

type OwnerPanelProps = {
  isOwner: boolean;
  isLastAdmin: boolean;
  onShowFundModal: () => void;
  onShowLimitsModal: () => void;
  onShowLeaveModal: () => void;
  styles: any;
};

const OwnerPanel: React.FC<OwnerPanelProps> = ({
  isOwner,
  isLastAdmin,
  onShowFundModal,
  onShowLimitsModal,
  onShowLeaveModal,
  styles: s,
}) => {
  return (
    <div style={s.sideBox}>
      <div style={s.sideHeader}>Owner Functions</div>
      <div style={s.sideBody}>
        {isOwner ? (
          <>
            <button style={s.primaryButton} onClick={onShowFundModal}>
              Fund Wallet
            </button>

            <div style={{ height: 12 }} />

            <button style={s.primaryButton} onClick={onShowLimitsModal}>
              View Limits
            </button>

            <div style={{ height: 12 }} />

            <button
              style={{
                ...s.secondaryButton,
                backgroundColor: "#ed1b1b",
                border: "1px solid #a33",
              }}
              disabled={isLastAdmin}
              onClick={onShowLeaveModal}
            >
              Leave Wallet
            </button>

            {isLastAdmin && (
              <p style={s.errorText}>
                You cannot leave — you are the last admin.
              </p>
            )}
          </>
        ) : (
          <p>Sorry, you're not this wallet's owner</p>
        )}
      </div>
    </div>
  );
};

export default OwnerPanel;
