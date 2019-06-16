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

export type CompletedEndorsing  = {
    rewards?: string;
    level: number;
    cycle?: number;
    priority?: number;
    slots?: number[];
    timestamp?: string;
}

export type CompletedEndorsingFromServer = {
    block?: string;
    source?: {
        tz: string;
        alias?: string;
    };
    distance_level?: number;
    lr_nslot: number;
} & CompletedEndorsing;