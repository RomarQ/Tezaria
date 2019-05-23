import React from 'react';
import { Dispatch, bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { withSnackbar, withSnackbarProps, OptionsObject } from 'notistack';
import Button from '@material-ui/core/Button';
import LoggerActions, { LogTypes, LoggerActionsPrototypes } from '../actions/logger';
import { LoggerProps } from '../reducers/logger';

type Props = {
    logs: LoggerActionProps[];
    loggerActions: LoggerActionsPrototypes;
} & withSnackbarProps & OptionsObject;

const Container: React.FC<Props> = ({ logs, enqueueSnackbar, loggerActions }) => {
    const snackCounter = React.useRef(0);

    React.useEffect(() => {
        console.log(snackCounter, logs)
        logs.filter(log => log.key > snackCounter.current)
            .forEach(log => {
                snackCounter.current++;
                enqueueSnackbar(String(log.message), {
                    variant: log.type,
                    anchorOrigin: {
                        vertical: ['error', 'success'].includes(log.type) ? 'top' : 'bottom',
                        horizontal: 'center'
                    },
                    preventDuplicate: true,
                    persist: log.type === LogTypes.ERROR,
                    action: (
                        <Button size="small">{'Dismiss'}</Button>
                    ),
                    onExited: () => log.type != 'error' && loggerActions.remove(log)
                });
            });
    });

    return null;
};

const mapLogsToProps = ({ logger }:LoggerProps) => ({ logs: logger });
const mapDispatchersToProps = (dispatch: Dispatch ) => ({ loggerActions: bindActionCreators(LoggerActions, dispatch) });


export default connect(
    mapLogsToProps,
    mapDispatchersToProps
)(withSnackbar(Container));