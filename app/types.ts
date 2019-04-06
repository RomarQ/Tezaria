import { KeysType } from "./utils/padaria/types";

export interface UserSettingsType {
  nodeAddress?: string;
  apiAddress?: string;
  delegatorFee?: number;
}

export interface UserDataType {
  ready?: boolean;
  keys?: KeysType;
  settings: UserSettingsType;
}
