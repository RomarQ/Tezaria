export interface AccuserInterface {
    endorsements: [];
    blocks: BlockProps[];
    preservedLevels: number;
    highestLevelEncountered: number;
    run: (pkh:string, logger: (log:LogProps) => any) => Promise<void>;
}