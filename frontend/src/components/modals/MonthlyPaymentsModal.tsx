type MemberData = {
  addr: string;
  last_payment_timestamp: number;
};

type Props = {
  show: boolean;
  walletData: any;
  currentUserHex: string | null;
  handlePayMonthlyFee: () => void;
  setShow: (v: boolean) => void;
  styles: any;
};

const MonthlyPaymentsModal: React.FC<Props> = ({
  show,
  walletData,
  currentUserHex,
  handlePayMonthlyFee,
  setShow,
  styles: s,
}) => {
  if (!show || !walletData || !currentUserHex) return null;

  const history: MemberData[] =
    walletData.member_payment_history || [];

  const member = history.find(
    (m) => m.addr.toLowerCase() === currentUserHex.toLowerCase()
  );

  const now = Math.floor(Date.now() / 1000);

  let secondsPassed = 0;
  let daysPassed = 0;

  if (member) {
    secondsPassed = now - Number(member.last_payment_timestamp);
    daysPassed = Math.floor(secondsPassed / (60 * 60 * 24));
  }

  const overdue = daysPassed >= 30;

  return (
    <div style={s.modalOverlay}>
      <div style={s.modal}>
        <h2>Monthly Membership</h2>

        {member ? (
          <>
            <p
              style={{
                color: overdue ? "#dc2626" : "inherit",
                fontWeight: overdue ? "bold" : "normal",
              }}
            >
              {daysPassed} days since last payment
            </p>

            {overdue && (
              <p style={{ color: "#dc2626" }}>
                Payment overdue!
              </p>
            )}

            <div style={{ height: 16 }} />

            <button
              style={{
                ...s.primaryButton,
                backgroundColor: "#22c55e",
                border: "1px solid #15803d",
              }}
              onClick={handlePayMonthlyFee}
            >
              Pay Monthly Fee
            </button>
          </>
        ) : (
          <p>No payment record found.</p>
        )}

        <div style={{ height: 20 }} />

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

export default MonthlyPaymentsModal;
