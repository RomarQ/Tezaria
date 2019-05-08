declare module 'react-blockies';

declare interface UserSettingsType {
    nodeAddress?: string;
    tzScanAddress?: string;
    apiAddress?: string;
    delegatorFee?: number;
    rewardsBatchSize?: number;
}

declare interface UserDataType {
    ready?: boolean;
    keys?: KeysType;
    settings: UserSettingsType;
}
