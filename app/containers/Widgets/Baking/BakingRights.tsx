import React from 'react';
import { bindActionCreators, Dispatch, ActionCreatorsMapObject } from 'redux';
import { connect } from 'react-redux';
import Component from '../../../components/Widgets/Baking/BakingRights';
import LoggerActions, { LoggerActionsPrototypes, LogTypes, LogOrigins } from '../../../actions/logger';
import baker, { IncomingBakings, CompletedBaking } from '../../../utils/padaria/baker';

type Props = {
    pkh:    string;
    logger: ActionCreatorsMapObject<LoggerActionsPrototypes>;
};

const Container = ({ pkh, logger }:Props) => {
    const isMounted = React.useRef(true);
    const [incomingBakings, setIB] = React.useState(null as IncomingBakings);
    const [completedBakings, setCB] = React.useState(null as CompletedBaking[]);
    React.useEffect(() => {
        getIncomingBakings();
        getCompletedBakings();
        
        return () => { isMounted.current = false; }
    }, []);

    React.useEffect(() => {
        const id = setInterval(() => {
            getIncomingBakings();
            getCompletedBakings();
        }, 20000);

        return () => { clearInterval(id); }
    });

    const getIncomingBakings = async () => {
        baker.getIncomingBakings(pkh).then((result:IncomingBakings) => {
            if(isMounted.current && !!result)
                setIB(result);
        })
        .catch((error:Error) => {
            logger.add({
                logType:  LogTypes.ERROR,
                message:  error,
                origin: LogOrigins.RPC
            });
        });
    }
    const getCompletedBakings = async () => {
        const result = await baker.getCompletedBakings(pkh).then((result:CompletedBaking[]) => {
            if(isMounted.current && !!result)
                setCB(result);
        })
        .catch((error:Error) => {
            logger.add({
                logType:  LogTypes.ERROR,
                message:  error.message,
                origin: LogOrigins.RPC
            });
        });
    }

    return <Component incomingBakings={incomingBakings} completedBakings={completedBakings} />;
};

const LoggerDispatchers = (dispatch: Dispatch) => ({ logger: bindActionCreators(LoggerActions, dispatch) });

export default connect(null, LoggerDispatchers)(Container);