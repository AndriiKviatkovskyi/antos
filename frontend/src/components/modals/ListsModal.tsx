interface ListsModalProps {
  show: boolean;

  useWhitelist: boolean;
  membershipBlacklist: string[];
  recipientWhitelist: string[];
  recipientBlacklist: string[];

  newListAddress: string;

  setShow: (value: boolean) => void;
  setNewListAddress: (value: string) => void;

  handleToggleRecipientMode: () => void;
  handleAddToList: (type: "membership" | "recipient") => void;
  handleRemoveFromList: (
    type: "membership" | "recipient",
    address: string
  ) => void;

  fetchData: () => Promise<void>;

  styles: any; // replace with proper type if needed
}

export default function ListsModal({
  show,
  useWhitelist,
  membershipBlacklist,
  recipientWhitelist,
  recipientBlacklist,
  newListAddress,
  setShow,
  setNewListAddress,
  handleToggleRecipientMode,
  handleAddToList,
  handleRemoveFromList,
  fetchData,
  styles,
}: ListsModalProps) {
  if (!show) return null;

  const recipientList = useWhitelist
    ? recipientWhitelist
    : recipientBlacklist;

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.listsModal}>
        <h3>Lists Management</h3>

        <div style={{ marginBottom: 12 }}>
          <label>
            <input
              type="checkbox"
              checked={useWhitelist}
              onChange={handleToggleRecipientMode}
            />{" "}
            Recipient Whitelist Mode
          </label>
        </div>

        {/* ================= Membership Blacklist ================= */}

        <h4>Membership Blacklist</h4>

        <ul style={styles.ownersList}>
          {membershipBlacklist.map((addr) => (
            <li key={addr} style={styles.ownerItem}>
              {addr}
              <button
                style={styles.secondaryButton}
                onClick={() =>
                  handleRemoveFromList("membership", addr)
                }
              >
                Remove
              </button>
            </li>
          ))}
        </ul>

        <input
          style={styles.input}
          placeholder="0x..."
          value={newListAddress}
          onChange={(e) => setNewListAddress(e.target.value)}
        />

        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button
            style={styles.primaryButton}
            onClick={() => handleAddToList("membership")}
          >
            Add to Membership Blacklist
          </button>

          <button
            style={styles.primaryButton}
            onClick={() => handleAddToList("recipient")}
          >
            Add to Recipient List
          </button>
        </div>

        {/* ================= Recipient List ================= */}

        <h4>
          Recipient List ({useWhitelist ? "Whitelist" : "Blacklist"})
        </h4>

        <ul style={styles.ownersList}>
          {recipientList.map((addr) => (
            <li key={addr} style={styles.ownerItem}>
              {addr}
              <button
                style={styles.secondaryButton}
                onClick={() =>
                  handleRemoveFromList("recipient", addr)
                }
              >
                Remove
              </button>
            </li>
          ))}
        </ul>

        <div style={styles.modalButtons}>
          <button
            style={styles.secondaryButton}
            onClick={async () => {
              setShow(false);
              await fetchData();
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
