import { useState } from "react";

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

  handleSetMembershipBlacklist: (list: string[]) => void;
  handleSetRecipientList: (list: string[], useWhitelist: boolean) => void;

  fetchData: () => Promise<void>;

  styles: any;
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
  handleSetMembershipBlacklist,
  handleSetRecipientList,
  fetchData,
  styles,
}: ListsModalProps) {
  const [bulkMembershipInput, setBulkMembershipInput] = useState("");
  const [bulkRecipientInput, setBulkRecipientInput] = useState("");

  if (!show) return null;

  const recipientList = useWhitelist
    ? recipientWhitelist
    : recipientBlacklist;

  const parseAddresses = (input: string): string[] => {
    return input
      .split(/[\n, ]+/)
      .map((a) => a.trim())
      .filter((a) => a.length > 0);
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.listsModal}>
        <button 
            style={styles.closeCross} 
            onClick={() => setShow(false)}
            aria-label="Close"
        >
          ×
        </button>
        <h3>Lists Management</h3>

        {/* ================= Recipient Mode ================= */}

        <div style={{ marginBottom: 16 }}>
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

        {/* Single add */}
        <input
          style={styles.input}
          placeholder="0x..."
          value={newListAddress}
          onChange={(e) => setNewListAddress(e.target.value)}
        />

        <button
          style={styles.primaryButton}
          onClick={() => handleAddToList("membership")}
        >
          Add to Membership Blacklist
        </button>

        {/* Bulk */}
        <h5 style={{ marginTop: 16 }}>Bulk Replace</h5>

        <textarea
          style={styles.input}
          placeholder="0x1...\n0x2...\n0x3..."
          value={bulkMembershipInput}
          onChange={(e) => setBulkMembershipInput(e.target.value)}
        />

        <button
          style={styles.primaryButton}
          onClick={() => {
            const parsed = parseAddresses(bulkMembershipInput);
            handleSetMembershipBlacklist(parsed);
          }}
        >
          Replace Entire Membership Blacklist
        </button>

        {/* ================= Recipient List ================= */}

        <h4 style={{ marginTop: 24 }}>
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

        {/* Single add */}
        <button
          style={styles.primaryButton}
          onClick={() => handleAddToList("recipient")}
        >
          Add to Recipient List
        </button>

        {/* Bulk */}
        <h5 style={{ marginTop: 16 }}>Bulk Replace</h5>

        <textarea
          style={styles.input}
          placeholder="0x1...\n0x2...\n0x3..."
          value={bulkRecipientInput}
          onChange={(e) => setBulkRecipientInput(e.target.value)}
        />

        <button
          style={styles.primaryButton}
          onClick={() => {
            const parsed = parseAddresses(bulkRecipientInput);
            handleSetRecipientList(parsed, useWhitelist);
          }}
        >
          Replace Entire Recipient List
        </button>

        {/* Warning */}
        <p style={{ color: "orange", fontSize: 12, marginTop: 12 }}>
          Warning: Replacing lists may cancel pending proposals in Safe mode.
        </p>

        {/* Close */}
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