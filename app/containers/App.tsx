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
import { UserDataType } from '../types';
import UserDataActions, { UserDataActionsProps } from '../actions/userData';
import LoggerActions, { LoggerActionsPrototypes, LogTypes, LogOrigins } from '../actions/logger';

import Nav from '../components/Nav';
import Snackbar from './Snackbar';

type Props = {
    loading: boolean;
    userDataReady: boolean;
    userData: UserDataType;
    userDataFunc: UserDataActionsProps;
    loader: LoaderPrototype;
    pending: string[];
    errors: string[];
    logger: ActionCreatorsMapObject<LoggerActionsPrototypes>;
} & RouteComponentProps;

const App: React.FC<Props> = props => {
    const { loading, pending, userDataFunc, userData, loader, history, logger } = props;

    React.useEffect(() => {
        props.loader(LoadTypes.USER_DATA);
        props.userDataFunc.loadUserData().then(({ settings }) => {
            props.loader(LoadTypes.PADARIA_NODE);
            
            rpc.load({
                nodeAddress: settings.nodeAddress,
                tzScanAddress: settings.tzScanAddress,
                apiAddress: settings.apiAddress
            })
            .then(() => {
                props.loader(LoadTypes.PADARIA_NODE, true);
            })
            .catch((error:Error) => {
                logger.add({
                    logType:  LogTypes.ERROR,
                    message:  error,
                    origin: LogOrigins.RPC
                });

                props.loader(LoadTypes.PADARIA_NODE, true);
            });

        })
        .catch((error:Error) => logger.add({
            logType:  LogTypes.ERROR,
            message:  error,
            origin: LogOrigins.RPC
        }));
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
const UserDataProps = ({ userData }:{ userData:UserDataType }) => ({ userData });
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
