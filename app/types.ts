export type UserSettingsType = {
    nodeAddress?: string;
    tzScanAddress?: string;
    apiAddress?: string;
    delegatorFee?: number;
}

export type UserDataType = {
    ready?: boolean;
    keys?: KeysType;
    settings: UserSettingsType;
}
