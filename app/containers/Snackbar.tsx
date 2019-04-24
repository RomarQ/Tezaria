import React from 'react';
import { connect } from 'react-redux';
import { withSnackbar, withSnackbarProps } from 'notistack';
import Button from '@material-ui/core/Button';
import { LoggerActionProps, LogTypes } from '../actions/logger';
import { LoggerProps } from '../reducers/logger';

type Props = {
    logs: LoggerActionProps[];
} & withSnackbarProps;

const Container: React.FC<Props> = ({ logs, enqueueSnackbar }) => {
    const isMounted = React.useRef(true);
    const snackCounter = React.useRef(0);

    React.useEffect(() => {
        isMounted.current = true;

        if (logs.length === 0) return;

        const snack = logs[logs.length-1];
        if (snack.key > snackCounter.current++) {
            
            enqueueSnackbar(String(snack.message), {
                variant: snack.logType,
                anchorOrigin: {
                    vertical: 'top',
                    horizontal: 'center'
                },
                preventDuplicate: true,
                persist: snack.logType === LogTypes.ERROR,
                action: (
                    <Button size="small">{'Dismiss'}</Button>
                ),
            });
        }

        return () => {
            isMounted.current = false;
        };
    });

    return null;
};

const mapLogsToProps = ({ logger }:LoggerProps) => ({ logs: logger });

export default connect(
    mapLogsToProps
)(withSnackbar(Container));