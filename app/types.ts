export type UserSettingsType = {
    nodeAddress?: string;
    tzScanAddress?: string;
    apiAddress?: string;
    delegatorFee?: number;
    rewardsBatchSize?: number;
}

export type UserDataType = {
    ready?: boolean;
    keys?: KeysType;
    settings: UserSettingsType;
}
