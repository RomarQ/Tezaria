declare module 'react-blockies';

declare interface UserSettingsType {
    nodeAddress?: string;
    nodePort?: string;
    tzScanAddress?: string;
    apiAddress?: string;
    delegatorFee?: number;
    rewardsBatchSize?: number;
}

declare interface UserDataProps {
    ready?: boolean;
    keys?: KeysType;
    settings: UserSettingsType;
}
