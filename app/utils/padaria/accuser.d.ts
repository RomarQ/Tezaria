export interface AccuserInterface {
	running: boolean
	endorsements: []
	blocks: BlockProps[]
	preservedLevels: number
	highestLevelEncountered: number
	run: (pkh: string, logger: (log: LogProps) => void) => Promise<void>
	stop: () => void
}
