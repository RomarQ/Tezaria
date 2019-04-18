import { KeysType } from './types';
import { BlockProps } from './rpc';

export interface AccuserInterface {
    endorsements: [];
    blocks: BlockProps[];
    preservedLevels: number;
    highestLevelEncountered: number;
    run: (keys:KeysType, head:BlockProps) => Promise<void>;
    accuse: () => void;
}