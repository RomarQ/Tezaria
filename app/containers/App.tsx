import React from 'react';
import { compose, Dispatch, bindActionCreators, ActionCreatorsMapObject } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { RouteComponentProps } from "react-router";
import Routes from './Routes';
import Splash from '../containers/Splash';

import rpc from '../utils/padaria/rpc';
import { LoaderState } from '../reducers/loader';
import LoaderAction, { LoadTypes, LoaderPrototype } from '../actions/loader';
import UserDataActions, { UserDataActionsPrototypes } from '../actions/userData';
import LoggerActions, { LoggerActionsPrototypes, LogTypes } from '../actions/logger';

import { LogOrigins } from '../utils/padaria/logger';

import Nav from '../components/Nav';
import Snackbar from './Snackbar';

interface Props extends RouteComponentProps {
    loading: boolean;
    userDataReady: boolean;
    userData: UserDataProps;
    userDataFunc: UserDataActionsPrototypes;
    loader: LoaderPrototype;
    pending: string[];
    errors: string[];
    logger: LoggerActionsPrototypes;
}

const App: React.FC<Props> = props => {
    const { loading, pending, userDataFunc, userData, loader, history, logger } = props;

    React.useEffect(() => {
        props.loader(LoadTypes.USER_DATA);
        props.userDataFunc.loadUserData().then(({ settings }) => {
            props.loader(LoadTypes.PADARIA_NODE);
            
            rpc.load({
                nodePort: settings.nodePort,
                nodeAddress: settings.nodeAddress,
                tzScanAddress: settings.tzScanAddress,
                apiAddress: settings.apiAddress,
                delegatorFee: settings.delegatorFee,
                rewardsBatchSize: settings.rewardsBatchSize,
            })
            .catch((error:Error) => {
                logger.add({
                    type: LogTypes.ERROR,
                    message: error.message,
                    origin: LogOrigins.RPC
                });
            });

            props.loader(LoadTypes.PADARIA_NODE, true);
            props.loader(LoadTypes.USER_DATA, true);
        })
        .catch((error:Error) => {
            props.loader(LoadTypes.USER_DATA, true);
            logger.add({
                type: LogTypes.ERROR,
                message: error.message,
                origin: LogOrigins.RPC
            });
        });
    }, []);
    
    console.log(props);
    return (
        <React.Fragment>
            <Snackbar />
            {loading 
                ? <Splash waitingFor={pending} /> 
                : (
                    <React.Fragment>
                        {userData.ready && !userData.keys.encrypted ? (
                            <Nav
                                userDataFunc={userDataFunc}
                                loader={loader}
                                history={history}
                            />
                        ) : null
                        }
                        <div id="content">
                            <Routes {...props} />
                        </div>
                    </React.Fragment>
                )
            }
        </React.Fragment>
    )
}

// Loader
const LoaderProps = ({ loader }: LoaderState) => loader;
const LoaderDispatcher = (dispatch: Dispatch) => bindActionCreators(LoaderAction, dispatch);

// User Data
const UserDataProps = ({ userData }:{ userData:UserDataProps }) => ({ userData });
const UserDataDispatchers = (dispatch: Dispatch) => ({ userDataFunc: bindActionCreators(UserDataActions, dispatch) });

// Logger
const LoggerDispatchers = (dispatch: Dispatch) => ({ logger: bindActionCreators(LoggerActions, dispatch) });

export default compose(
    connect(
        LoaderProps,
        LoaderDispatcher
    ),
    connect(
        UserDataProps,
        UserDataDispatchers
    ),
    connect(
        null,
        LoggerDispatchers
    )
)(withRouter(App));
