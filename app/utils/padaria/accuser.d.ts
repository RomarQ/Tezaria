import { BlockProps } from './rpc';

export interface AccuserInterface {
    endorsements: [];
    blocks: BlockProps[];
    preservedLevels: number;
    highestLevelEncountered: number;
    run: (keys:KeysType, logger: (log:LogProps) => any) => Promise<void>;
}