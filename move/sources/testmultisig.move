module multisig_addr::simple_multisig {
    use std::signer;
    use std::vector;

    /// Error codes
    const ENOT_OWNER: u64 = 1;
    const EALREADY_APPROVED: u64 = 2;
    const EPROPOSAL_ALREADY_EXECUTED: u64 = 4;
    const EMAX_OWNERS_REACHED: u64 = 5;
    const ENOT_ADMIN: u64 = 6;
    const EPROPOSAL_NOT_FOUND: u64 = 7;

    struct MultisigStore has key {
        owners: vector<address>,
        max_owners: u64,
        admin: address,
        proposals: vector<Proposal>,
        next_proposal_id: u64,
        treasury_balance: u64,
    }

    struct Proposal has store, copy, drop {
        id: u64,
        creator: address,
        amount: u64,
        approvals: vector<address>,
        is_executed: bool,
    }

    public entry fun initialize(admin: &signer, max_owners: u64) {
        let admin_addr = signer::address_of(admin);
        move_to(admin, MultisigStore {
            owners: vector::empty<address>(),
            max_owners,
            admin: admin_addr,
            proposals: vector::empty<Proposal>(),
            next_proposal_id: 0,
            treasury_balance: 1000,
        });
    }

    public entry fun add_owner(admin: &signer, new_owner: address) acquires MultisigStore {
        let admin_addr = signer::address_of(admin);
        let store = borrow_global_mut<MultisigStore>(@multisig_addr);
        assert!(store.admin == admin_addr, ENOT_ADMIN);
        assert!(vector::length(&store.owners) < store.max_owners, EMAX_OWNERS_REACHED);
        
        if (!vector::contains(&store.owners, &new_owner)) {
            vector::push_back(&mut store.owners, new_owner);
        };
    }

    /// Now users can call this multiple times to create proposals with unique IDs
    public entry fun propose_withdrawal(creator: &signer, amount: u64) acquires MultisigStore {
        let creator_addr = signer::address_of(creator);
        let store = borrow_global_mut<MultisigStore>(@multisig_addr);
        assert!(vector::contains(&store.owners, &creator_addr), ENOT_OWNER);

        let new_proposal = Proposal {
            id: store.next_proposal_id,
            creator: creator_addr,
            amount,
            approvals: vector[creator_addr],
            is_executed: false,
        };

        vector::push_back(&mut store.proposals, new_proposal);
        store.next_proposal_id = store.next_proposal_id + 1;
    }

    /// Approve by Proposal ID instead of address
    public entry fun approve(approver: &signer, proposal_id: u64) acquires MultisigStore {
        let approver_addr = signer::address_of(approver);
        let store = borrow_global_mut<MultisigStore>(@multisig_addr);
        
        assert!(vector::contains(&store.owners, &approver_addr), ENOT_OWNER);

        // Find the proposal in the vector
        let i = 0;
        let len = vector::length(&store.proposals);
        let found = false;
        
        while (i < len) {
            let proposal = vector::borrow_mut(&mut store.proposals, i);
            if (proposal.id == proposal_id) {
                assert!(!proposal.is_executed, EPROPOSAL_ALREADY_EXECUTED);
                assert!(!vector::contains(&proposal.approvals, &approver_addr), EALREADY_APPROVED);
                
                vector::push_back(&mut proposal.approvals, approver_addr);
                
                // Threshold Check
                let threshold = (vector::length(&store.owners) / 2) + 1;
                if (vector::length(&proposal.approvals) >= threshold) {
                    proposal.is_executed = true;
                };
                found = true;
                break
            };
            i = i + 1;
        };
        assert!(found, EPROPOSAL_NOT_FOUND);
    }

    #[view]
    public fun check_proposal_by_id(proposal_id: u64): (u64, bool, u64) acquires MultisigStore {
        let store = borrow_global<MultisigStore>(@multisig_addr);
        let i = 0;
        while (i < vector::length(&store.proposals)) {
            let prop = vector::borrow(&store.proposals, i);
            if (prop.id == proposal_id) {
                return (prop.amount, prop.is_executed, vector::length(&prop.approvals))
            };
            i = i + 1;
        };
        abort EPROPOSAL_NOT_FOUND
    }

    #[test_only]
    use aptos_framework::account::create_account_for_test;

    #[test(admin = @multisig_addr, o1 = @0x11, o2 = @0x22, o3 = @0x33)]
    fun test_multi_proposal_flow(
        admin: signer, o1: signer, o2: signer, o3: signer
    ) acquires MultisigStore {
        let admin_addr = signer::address_of(&admin);
        create_account_for_test(admin_addr);
        
        initialize(&admin, 10);
        add_owner(&admin, @0x11);
        add_owner(&admin, @0x22);
        add_owner(&admin, @0x33);

        // O1 initiates TWO proposals
        propose_withdrawal(&o1, 100); // ID 0
        propose_withdrawal(&o1, 200); // ID 1

        // Verify ID 0 exists
        let (amt0, exec0, _) = check_proposal_by_id(0);
        assert!(amt0 == 100 && !exec0, 0);

        // O2 approves ID 1 (The second one)
        approve(&o2, 1);
        
        // Verify ID 1 is executed, but ID 0 is NOT
        let (_, exec1, _) = check_proposal_by_id(1);
        let (_, exec0_after, _) = check_proposal_by_id(0);
        assert!(exec1 == true, 1);
        assert!(exec0_after == false, 2);
    }
}