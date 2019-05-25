import React from 'react';
import { bindActionCreators, Dispatch } from 'redux';
import { connect } from 'react-redux';

import Component from '../../../components/Widgets/Endorsing/EndorsingRights';
import { IncomingEndorsings, CompletedEndorsing } from '../../../utils/padaria/endorser.d';
import endorser from '../../../utils/padaria/endorser';
import LoggerActions, { LoggerActionsPrototypes, LogTypes } from '../../../actions/logger';
import { LogOrigins } from '../../../utils/padaria/logger';

interface Props {
    pkh:    string;
    logger: LoggerActionsPrototypes;
};

const Container = ({ pkh, logger }:Props) => {
    const isMounted = React.useRef(true);
    const [incomingEndorsings, setIE] = React.useState(null as IncomingEndorsings);
    const [completedEndorsings, setCE] = React.useState(null as CompletedEndorsing[]);

    React.useEffect(() => {
        isMounted.current = true;
        getIncomingEndorsings();
        getCompletedEndorsings();

        const id = setInterval(() => {
            getIncomingEndorsings();
            getCompletedEndorsings();
        }, 20000);

        return () => {
            isMounted.current = false;
            clearInterval(id);
        }
    }, []);

    const getIncomingEndorsings = async () => {
        endorser.getIncomingEndorsings(pkh).then((result:IncomingEndorsings) => (
            (isMounted.current && !!result) && setIE(result)
        ))
        .catch((error:Error) => {
            logger.add({
                type: LogTypes.ERROR,
                message: error.message,
                origin: LogOrigins.RPC
            });
        });
    }
    const getCompletedEndorsings = async () => {
        endorser.getCompletedEndorsings(pkh).then((result:CompletedEndorsing[]) => (
            (isMounted.current && !!result) && setCE(result)
        ))
        .catch((error:Error) => {
            logger.add({
                type: LogTypes.ERROR,
                message: error.message,
                origin: LogOrigins.TzScan
            });
        });
    }

    return <Component incomingEndorsings={incomingEndorsings} completedEndorsings={completedEndorsings} />;
}

const LoggerDispatchers = (dispatch: Dispatch) => ({ logger: bindActionCreators(LoggerActions, dispatch) });

export default connect(null, LoggerDispatchers)(Container);