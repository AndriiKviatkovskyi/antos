module multisig_addr::simple_multisig {
    use std::signer;
    use std::vector;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::account::{Self, SignerCapability};

    /// Error codes
    const ENOT_OWNER: u64 = 1;
    const EALREADY_APPROVED: u64 = 2;
    const EPROPOSAL_ALREADY_EXECUTED: u64 = 4;
    const EMAX_OWNERS_REACHED: u64 = 5;
    const ENOT_ADMIN: u64 = 6;
    const EPROPOSAL_NOT_FOUND: u64 = 7;
    const EINSUFFICIENT_FUNDS: u64 = 8;

    struct MultisigStore has key {
        owners: vector<address>,
        max_owners: u64,
        admin: address,
        proposals: vector<Proposal>,
        next_proposal_id: u64,
        signer_cap: SignerCapability,
    }

    struct Proposal has store, copy, drop {
        id: u64,
        creator: address,
        recipient: address,
        amount: u64, 
        approvals: vector<address>,
        is_executed: bool,
    }

    /// Step 1: Initialize creates the Resource Account.
    /// You only run this once.
    public entry fun initialize(admin: &signer, max_owners: u64) {
        let admin_addr = signer::address_of(admin);
        let (_resource_signer, resource_cap) = account::create_resource_account(admin, b"TREASURY_V1");
        
        move_to(&_resource_signer, MultisigStore {
            owners: vector::empty<address>(),
            max_owners,
            admin: admin_addr,
            proposals: vector::empty<Proposal>(),
            next_proposal_id: 0,
            signer_cap: resource_cap,
        });
    }

    /// Step 2: Add owners by pointing to the multisig_address
    public entry fun add_owner(admin: &signer, multisig_address: address, new_owner: address) acquires MultisigStore {
        let store = borrow_global_mut<MultisigStore>(multisig_address);
        assert!(store.admin == signer::address_of(admin), ENOT_ADMIN);
        assert!(vector::length(&store.owners) < store.max_owners, EMAX_OWNERS_REACHED);
        
        if (!vector::contains(&store.owners, &new_owner)) {
            vector::push_back(&mut store.owners, new_owner);
        };
    }

    /// Step 3: Propose a transfer
    public entry fun propose_transfer(
        creator: &signer, 
        multisig_address: address,
        recipient: address, 
        amount: u64
    ) acquires MultisigStore {
        let creator_addr = signer::address_of(creator);
        let store = borrow_global_mut<MultisigStore>(multisig_address);
        assert!(vector::contains(&store.owners, &creator_addr), ENOT_OWNER);

        let new_proposal = Proposal {
            id: store.next_proposal_id,
            creator: creator_addr,
            recipient,
            amount,
            approvals: vector[creator_addr],
            is_executed: false,
        };

        vector::push_back(&mut store.proposals, new_proposal);
        store.next_proposal_id = store.next_proposal_id + 1;
    }

    /// Step 4: Approve (Triggering the Treasury Signer)
    public entry fun approve(approver: &signer, multisig_address: address, proposal_id: u64) acquires MultisigStore {
        let approver_addr = signer::address_of(approver);
        let store = borrow_global_mut<MultisigStore>(multisig_address);
        assert!(vector::contains(&store.owners, &approver_addr), ENOT_OWNER);

        let i = 0;
        let len = vector::length(&store.proposals);
        while (i < len) {
            let proposal = vector::borrow_mut(&mut store.proposals, i);
            if (proposal.id == proposal_id) {
                assert!(!proposal.is_executed, EPROPOSAL_ALREADY_EXECUTED);
                assert!(!vector::contains(&proposal.approvals, &approver_addr), EALREADY_APPROVED);
                vector::push_back(&mut proposal.approvals, approver_addr);
                
                let threshold = (vector::length(&store.owners) / 2) + 1;
                if (vector::length(&proposal.approvals) >= threshold) {
                    let treasury_signer = account::create_signer_with_capability(&store.signer_cap);
                    let treasury_addr = signer::address_of(&treasury_signer);
                    
                    assert!(coin::balance<AptosCoin>(treasury_addr) >= proposal.amount, EINSUFFICIENT_FUNDS);
                    coin::transfer<AptosCoin>(&treasury_signer, proposal.recipient, proposal.amount);
                    
                    proposal.is_executed = true;
                };
                return
            };
            i = i + 1;
        };
        abort EPROPOSAL_NOT_FOUND
    }

    #[view]
    public fun get_treasury_balance(multisig_address: address): u64 {
        coin::balance<AptosCoin>(multisig_address)
    }

    // --- TEST SECTION ---
    
    #[test_only]
    use aptos_framework::aptos_coin;

    #[test(admin = @multisig_addr, o1 = @0x11, o2 = @0x22, rec = @0x33, framework = @0x1)]
    fun test_full_multisig_flow(
        admin: signer, o1: signer, o2: signer, rec: signer, framework: signer
    ) acquires MultisigStore {
        let admin_addr = signer::address_of(&admin);
        let rec_addr = signer::address_of(&rec);
        
        let (burn, mint) = aptos_coin::initialize_for_test(&framework);
        account::create_account_for_test(admin_addr);
        account::create_account_for_test(rec_addr);
        
        // 1. Initialize
        initialize(&admin, 10);

        // 2. Derive the REAL resource address used in the test
        let resource_addr = account::create_resource_address(&admin_addr, b"TREASURY_V1");
        account::create_account_for_test(resource_addr);

        // 3. Setup Owners using the derived address
        add_owner(&admin, resource_addr, @0x11);
        add_owner(&admin, resource_addr, @0x22);
        add_owner(&admin, resource_addr, @0x33);

        // 4. Fund the treasury
        let coins = coin::mint<AptosCoin>(1000, &mint);
        coin::deposit(resource_addr, coins);

        // 5. Propose and approve
        propose_transfer(&o1, resource_addr, rec_addr, 600);
        approve(&o2, resource_addr, 0);

        // 6. Verification
        assert!(coin::balance<AptosCoin>(rec_addr) == 600, 1);
        assert!(get_treasury_balance(resource_addr) == 400, 2);

        coin::destroy_burn_cap(burn);
        coin::destroy_mint_cap(mint);
    }
}