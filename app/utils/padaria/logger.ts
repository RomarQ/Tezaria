export enum LogSeverity {
    VERY_HIGH,
    HIGH,
    MEDIUM,
    NORMAL,
    NEUTRAL
};

export enum LogOrigins {
    RPC         = 'RPC',
    API         = 'API',
    BAKER       = 'BAKER',
    ENDORSER    = 'ENDORSER',
    ACCUSER     = 'ACCUSER'
};