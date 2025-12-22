module multisig_addr::simple_multisig {
    use std::signer;
    use std::vector;
    use aptos_framework::timestamp;

    /// Error codes
    const ENOT_OWNER: u64 = 1;
    const EALREADY_APPROVED: u64 = 2;
    const ETHRESHOLD_NOT_MET: u64 = 3;
    const EPROPOSAL_ALREADY_EXECUTED: u64 = 4;

    struct MultisigStore has key {
        owners: vector<address>,
        threshold: u64,
        treasury_balance: u64, // Simulated treasury
    }

    struct Proposal has key {
        amount: u64,
        approvals: vector<address>,
        is_executed: bool,
    }

    /// Initialize the multisig with 3 accounts
    public entry fun initialize(
        admin: &signer, 
        owner1: address, 
        owner2: address, 
        owner3: address
    ) {
        let owners = vector[owner1, owner2, owner3];
        move_to(admin, MultisigStore {
            owners,
            threshold: 2,
            treasury_balance: 1000, // Starting simulation balance
        });
    }

    /// Create a proposal to spend from treasury
    public entry fun propose_withdrawal(creator: &signer, amount: u64) acquires MultisigStore {
        let creator_addr = signer::address_of(creator);
        let store = borrow_global<MultisigStore>(@multisig_addr);
        
        // Ensure the sender is one of the owners
        assert!(vector::contains(&store.owners, &creator_addr), ENOT_OWNER);

        move_to(creator, Proposal {
            amount,
            approvals: vector[creator_addr], // Proposer automatically approves
            is_executed: false,
        });
    }

    /// Approve an existing proposal
    public entry fun approve(
        approver: &signer, 
        proposal_owner_addr: address
    ) acquires Proposal, MultisigStore {
        let approver_addr = signer::address_of(approver);
        let store = borrow_global<MultisigStore>(@multisig_addr);
        
        // 1. Check if approver is an owner
        assert!(vector::contains(&store.owners, &approver_addr), ENOT_OWNER);

        let proposal = borrow_global_mut<Proposal>(proposal_owner_addr);
        
        // 2. Check if already executed
        assert!(!proposal.is_executed, EPROPOSAL_ALREADY_EXECUTED);

        // 3. Check if already approved by this person
        assert!(!vector::contains(&proposal.approvals, &approver_addr), EALREADY_APPROVED);

        vector::push_back(&mut proposal.approvals, approver_addr);

        // 4. Simulation: If threshold met, "execute" the transaction
        if (vector::length(&proposal.approvals) >= store.threshold) {
            execute_simulation(proposal, proposal_owner_addr);
        };
    }

    /// Internal simulation of the treasury transfer
    fun execute_simulation(proposal: &mut Proposal, _addr: address) {
        // In a real version, this would call aptos_account::transfer
        // For now, we just flip the bit to simulate success
        proposal.is_executed = true;
    }

    #[view]
    public fun check_proposal_status(proposal_owner_addr: address): (u64, bool, u64) acquires Proposal {
        let proposal = borrow_global<Proposal>(proposal_owner_addr);
        (proposal.amount, proposal.is_executed, vector::length(&proposal.approvals))
    }

    #[test_only]
    use aptos_framework::account::create_account_for_test;

    #[test(admin = @multisig_addr, owner1 = @0x111, owner2 = @0x222, owner3 = @0x333)]
    fun test_multisig_flow(
        admin: signer, 
        owner1: signer, 
        owner2: signer, 
        owner3: signer
    ) acquires MultisigStore, Proposal {
        let admin_addr = signer::address_of(&admin);
        let o1_addr = signer::address_of(&owner1);
        let o2_addr = signer::address_of(&owner2);
        let o3_addr = signer::address_of(&owner3);

        // 1. Setup: Create accounts and initialize multisig
        create_account_for_test(admin_addr);
        initialize(&admin, o1_addr, o2_addr, o3_addr);

        // 2. Propose: Owner 1 proposes a withdrawal of 500
        propose_withdrawal(&owner1, 500);
        
        // Check status: Should have 1 approval (from proposer) and not be executed
        let (amount, executed, num_approvals) = check_proposal_status(o1_addr);
        assert!(amount == 500, 0);
        assert!(!executed, 1);
        assert!(num_approvals == 1, 2);

        // 3. Approve: Owner 2 approves
        approve(&owner2, o1_addr);

        // 4. Verify: Since threshold is 2, it should now be executed
        let (_, executed, num_approvals) = check_proposal_status(o1_addr);
        assert!(executed, 3);
        assert!(num_approvals == 2, 4);
    }
}