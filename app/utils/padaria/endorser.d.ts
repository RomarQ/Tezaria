import { BlockProps } from './rpc';

export interface EndorderInterface {
    //
    // States
    //
    endorsedBlocks: any[],
    //
    // Functions
    //
    getCompletedEndorsings: (pkh:string) => Promise<CompletedEndorsing[]>;
    getIncomingEndorsings: (pkh:string) => Promise<IncomingEndorsings>;
    run: (pkh:string, header:BlockHeaderProps, logger: (log:LogProps) => void) => Promise<void>;
};

export type EndorsingRight = {
    cycle?: number;
    delegate: string;
    estimated_time: string;
    level: number;
    slots: number[];
}

export type EndorsingRights = {
    hasData: boolean;
    cycle?: number;
    endorsingRights?: [
        EndorsingRight[],
        EndorsingRight[]
    ];
}

export type EndorsingRightsFromServer = {
    oldest_cycle: number;
    endorsing_rights: EndorsingRight[][];
}

export type IncomingEndorsings = {
    hasData: boolean;
    cycle?: number;
    endorsings?: EndorsingRight[];
}

export type IncomingEndorsingsFromServer = {
    current_cycle: number;
    endorsings: EndorsingRight[][];
}

export type CompletedEndorsing = {
    reward: string | number;
    level: number;
    cycle: number;
    slots: number[];
    timestamp: string;
    total_slots: number;
    delegate_pkh: string;
    endorsed: boolean;
}
