declare module 'bs58check';
declare module 'electron-json-storage';

declare interface TezariaSettingsProps {
	nodeAddress?: string;
	nodePort?: number;
	tzScanAddress?: string;
	apiAddress?: string;
	delegatorFee?: number;
	rewardsBatchSize?: number;
}

declare interface LoggerActionProps {
	type: 'error' | 'warning' | 'info' | 'success';
	message: string;
	severity?: string;
	origin?: string;
}

declare interface TezosUnitType {
	char: string;
	unit: number;
}

declare type KeysType = {
	encrypted: boolean;
	sk?: string;
	pk?: string;
	pkh: string;
};

declare type BlockProps = {
	chain_id: string;
	hash: string;
	header: BlockHeaderProps;
	metadata: BlockMetadataProps;
	operations: UnsignedOperations;
	protocol?: string;
};

declare type NonceType = {
	hash: string;
	seedNonceHash: string;
	seed: string;
	level: number;
};

declare type BlockHeaderProps = {
	chain_id: string;
	context: string;
	hash: string;
	fitness: string[];
	level: number;
	operations_hash: string;
	predecessor: string;
	priority: number;
	seed_nonce_hash?: string;
	proof_of_work_nonce: string;
	proto: number;
	protocol?: string;
	signature: string;
	timestamp: string;
	validation_pass: number;
};

declare interface LevelProps {
	cycle: number;
	cycle_position: number;
	expected_commitment: boolean;
	level: number;
	level_position: number;
	voting_period: number;
	voting_period_position: number;
}

declare type BlockMetadataProps = {
	baker: string;
	balance_updates: Array<{
		cycle?: number;
		delegate?: string;
		change: string;
		contract?: string;
		kind: string;
	}>;
	consumed_gas: string;
	deactivated: [];
	level: LevelProps;
	max_block_header_length: number;
	max_operation_data_length: number;
	max_operation_list_length: Array<{
		max_op: number;
		max_size: number;
	}>;
	max_operations_ttl: number;
	next_protocol: string;
	nonce_hash: string;
	protocol: string;
	test_chain_status: {
		status: string;
	};
	voting_period_kind: string;
};
