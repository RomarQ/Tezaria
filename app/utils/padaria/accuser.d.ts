export interface AccuserInterface {
    running: boolean;
    endorsements: [];
    blocks: BlockProps[];
    preservedLevels: number;
    highestLevelEncountered: number;
    run: (pkh:string, logger: (log:LogProps) => any) => Promise<void>;
    stop: () => void;
}