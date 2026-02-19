import React from "react";

type MemberHistory = {
  addr: string;
  last_payment_timestamp: number;
};

interface Props {
  show: boolean;
  walletData: any;
  handleWipe: () => void;
  setShow: (v: boolean) => void;
  styles: any;
}

const MemberPaymentsAdminModal: React.FC<Props> = ({
  show,
  walletData,
  handleWipe,
  setShow,
  styles: s,
}) => {
  if (!show || !walletData) return null;

  const now = Math.floor(Date.now() / 1000);

  const history: MemberHistory[] =
    walletData.member_payment_history || [];

  return (
    <div style={s.modalOverlay}>
      <div style={s.modal}>
        <h2>Member Payment Status</h2>

        <div style={{ maxHeight: 300, overflowY: "auto" }}>
          {history.map((member) => {
            const daysPassed = Math.floor(
              (now - Number(member.last_payment_timestamp)) /
                (60 * 60 * 24)
            );

            const overdue = daysPassed >= 30;

            return (
              <div
                key={member.addr}
                style={{
                  padding: "8px 0",
                  borderBottom: "1px solid #eee",
                }}
              >
                <div>{member.addr}</div>
                <div
                  style={{
                    color: overdue ? "#dc2626" : "inherit",
                    fontWeight: overdue ? "bold" : "normal",
                  }}
                >
                  {daysPassed} days since last payment
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ height: 20 }} />

        {/* Wipe button */}
        <button
          style={{
            ...s.primaryButton,
            backgroundColor: "#dc2626",
            border: "1px solid #991b1b",
          }}
          onClick={handleWipe}
        >
          Wipe Delinquent Members
        </button>

        <div style={{ height: 12 }} />

        <button
          style={s.secondaryButton}
          onClick={() => setShow(false)}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default MemberPaymentsAdminModal;
