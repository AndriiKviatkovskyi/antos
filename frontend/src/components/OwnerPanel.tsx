import React from "react";

type OwnerPanelProps = {
  isOwner: boolean;
  isLastAdmin: boolean;
  walletMode: Number;
  onShowFundModal: () => void;
  onShowLimitsModal: () => void;
  onShowLeaveModal: () => void;
  onShowMonthlyModal: () => void; 
  styles: any;
};

const OwnerPanel: React.FC<OwnerPanelProps> = ({
  isOwner,
  isLastAdmin,
  walletMode,
  onShowFundModal,
  onShowLimitsModal,
  onShowLeaveModal,
  onShowMonthlyModal,
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

            {walletMode === 2 && (
              <>
                <div style={{ height: 12 }} />

                <button
                  style={{
                    ...s.primaryButton,
                    backgroundColor: "#22c55e",
                    border: "1px solid #15803d",
                  }}
                  onClick={onShowMonthlyModal}
                >
                  Monthly Payments
                </button>
              </>
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
