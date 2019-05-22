import React from 'react';
import { Dispatch, bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { withSnackbar, withSnackbarProps } from 'notistack';
import Button from '@material-ui/core/Button';
import LoggerActions, { LogTypes, LoggerActionsPrototypes } from '../actions/logger';
import { LoggerProps } from '../reducers/logger';

type Props = {
    logs: LoggerActionProps[];
    loggerActions: LoggerActionsPrototypes;
} & withSnackbarProps;

const Container: React.FC<Props> = ({ logs, enqueueSnackbar, loggerActions }) => {
    const isMounted = React.useRef(true);
    const snackCounter = React.useRef(0);

    React.useEffect(() => {
        isMounted.current = true;

        if (logs.length === 0) return;

        const snack = logs[logs.length-1];
        if (snack.key > snackCounter.current++) {
            
            enqueueSnackbar(String(snack.message), {
                variant: snack.type,
                anchorOrigin: {
                    vertical: ['error', 'success'].includes(snack.type) ? 'top' : 'bottom',
                    horizontal: 'center'
                },
                preventDuplicate: true,
                persist: snack.type === LogTypes.ERROR,
                action: (
                    <Button size="small">{'Dismiss'}</Button>
                ),
            });

            snack.type != 'error' &&
                loggerActions.remove(snack);
        }

        return () => {
            isMounted.current = false;
        };
    });

    return null;
};

const mapLogsToProps = ({ logger }:LoggerProps) => ({ logs: logger });
const mapDispatchersToProps = (dispatch: Dispatch ) => ({ loggerActions: bindActionCreators(LoggerActions, dispatch) });


export default connect(
    mapLogsToProps,
    mapDispatchersToProps
)(withSnackbar(Container));