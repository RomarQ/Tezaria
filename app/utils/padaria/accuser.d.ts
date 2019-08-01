export interface AccuserInterface {
  doubleBaking: boolean
  active: boolean
  endorsements: []
  blocks: BlockProps[]
  preservedLevels: number
  highestLevelEncountered: number
  run: (pkh: string, logger: (log: LoggerActionProps) => void) => Promise<void>
  stop: () => void
}
