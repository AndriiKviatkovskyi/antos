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
    const EALREADY_ADMIN: u64 = 9;

    struct MultisigStore has key {
        owners: vector<address>,
        admins: vector<address>, 
        max_owners: u64,
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

    /// Fixed struct abilities
    struct WalletInfo has drop, copy {
        owners: vector<address>,
        admins: vector<address>,
        max_owners: u64,
        balance: u64,
        next_proposal_id: u64,
        total_proposals: u64
    }

    public entry fun initialize(admin: &signer, max_owners: u64) {
        let admin_addr = signer::address_of(admin);
        let (_resource_signer, resource_cap) = account::create_resource_account(admin, b"TREASURY_V1");
        
        move_to(&_resource_signer, MultisigStore {
            owners: vector[admin_addr],
            admins: vector[admin_addr],
            max_owners,
            proposals: vector::empty<Proposal>(),
            next_proposal_id: 0,
            signer_cap: resource_cap,
        });
    }

    public entry fun add_owner(
        admin: &signer, 
        multisig_address: address, 
        new_owner: address, 
        make_admin: bool
    ) acquires MultisigStore {
        let store = borrow_global_mut<MultisigStore>(multisig_address);
        assert!(vector::contains(&store.admins, &signer::address_of(admin)), ENOT_ADMIN);
        assert!(vector::length(&store.owners) < store.max_owners, EMAX_OWNERS_REACHED);
        
        if (!vector::contains(&store.owners, &new_owner)) {
            vector::push_back(&mut store.owners, new_owner);
        };

        if (make_admin && !vector::contains(&store.admins, &new_owner)) {
            vector::push_back(&mut store.admins, new_owner);
        };
    }

    public entry fun promote_to_admin(
        admin: &signer, 
        multisig_address: address, 
        target_owner: address
    ) acquires MultisigStore {
        let store = borrow_global_mut<MultisigStore>(multisig_address);
        assert!(vector::contains(&store.admins, &signer::address_of(admin)), ENOT_ADMIN);
        assert!(vector::contains(&store.owners, &target_owner), ENOT_OWNER);
        assert!(!vector::contains(&store.admins, &target_owner), EALREADY_ADMIN);

        vector::push_back(&mut store.admins, target_owner);
    }

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
    public fun get_wallet_info(multisig_address: address): WalletInfo acquires MultisigStore {
        let store = borrow_global<MultisigStore>(multisig_address);
        WalletInfo {
            owners: store.owners,
            admins: store.admins,
            max_owners: store.max_owners,
            balance: coin::balance<AptosCoin>(multisig_address),
            next_proposal_id: store.next_proposal_id,
            total_proposals: vector::length(&store.proposals)
        }
    }

    // --- TEST SECTION ---
    
    #[test_only]
    use aptos_framework::aptos_coin;

    #[test_only]
    use std::debug;

    #[test(admin = @0x44, o1 = @0x11, o2 = @0x22, rec = @0x33, framework = @0x1)]
    fun test_full_multisig_flow(
        admin: signer, o1: signer, o2: signer, rec: signer, framework: signer
    ) acquires MultisigStore {
        let admin_addr = signer::address_of(&admin);
        let rec_addr = signer::address_of(&rec);
        let (burn, mint) = aptos_coin::initialize_for_test(&framework);
        
        account::create_account_for_test(admin_addr);
        account::create_account_for_test(rec_addr);
        account::create_account_for_test(@0x11);
        account::create_account_for_test(@0x22);

        // 1. Initialize
        initialize(&admin, 10);
        let resource_addr = account::create_resource_address(&admin_addr, b"TREASURY_V1");
        account::create_account_for_test(resource_addr);

        // 2. Test Multi-Admin Logic
        add_owner(&admin, resource_addr, @0x11, false); // O1 is owner
        add_owner(&admin, resource_addr, @0x22, true);  // O2 is admin

        // O2 (new admin) promotes O1 to admin
        promote_to_admin(&o2, resource_addr, @0x11);

        // 3. Verify Wallet Info View
        let info = get_wallet_info(resource_addr);
        assert!(vector::length(&info.admins) == 3, 100);
        assert!(vector::length(&info.owners) == 3, 101);

        // 4. Fund and Transact
        let coins = coin::mint<AptosCoin>(1000, &mint);
        coin::deposit(resource_addr, coins);

        propose_transfer(&o1, resource_addr, rec_addr, 600);
        approve(&o2, resource_addr, 0);

        // 5. Final Verification
        assert!(coin::balance<AptosCoin>(rec_addr) == 600, 1);

        let info = get_wallet_info(resource_addr);
        debug::print(&info);
        
        coin::destroy_burn_cap(burn);
        coin::destroy_mint_cap(mint);
    }
}