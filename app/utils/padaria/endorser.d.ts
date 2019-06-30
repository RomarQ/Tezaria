export interface EndorderInterface {
	//
	// States
	//
	endorsedBlocks: number[]
	//
	// Functions
	//
	getCompletedEndorsings: (pkh: string) => Promise<CompletedEndorsing[]>
	getIncomingEndorsings: (pkh: string) => Promise<IncomingEndorsings>
	run: (
		pkh: string,
		header: BlockHeaderProps,
		logger: (log: LogProps) => void
	) => Promise<void>
}

export interface EndorsingRight {
	cycle?: number
	delegate: string
	estimated_time: string
	level: number
	slots: number[]
}

export interface EndorsingRights {
	hasData: boolean
	cycle?: number
	endorsingRights?: [EndorsingRight[], EndorsingRight[]]
}

export interface EndorsingRightsFromServer {
	oldest_cycle: number
	endorsing_rights: EndorsingRight[][]
}

export interface IncomingEndorsings {
	hasData: boolean
	cycle?: number
	endorsings?: EndorsingRight[]
}

export interface IncomingEndorsingsFromServer {
	current_cycle: number
	endorsings: EndorsingRight[][]
}

export interface CompletedEndorsing {
	reward: string | number
	level: number
	cycle: number
	slots: number[]
	timestamp: string
	total_slots: number
	delegate_pkh: string
	endorsed: boolean
}
