import React from 'react';
import { compose, Dispatch, bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { RouteComponentProps } from "react-router";
import Routes from './Routes';
import Splash from '../containers/Splash';

import rpc from '../utils/padaria/rpc';
import { LoaderState } from '../reducers/loader';
import LoaderAction, { LoadTypes, LoaderPrototype } from '../actions/loader';
import { UserDataType } from '../types';
import UserDataActions, { LoadUserDataPrototype, ClearUserDataPrototype } from '../actions/userData';

import Nav from '../components/Nav';

interface Props extends RouteComponentProps {
    loading: boolean;
    userDataReady: boolean;
    userData: UserDataType;
    userDataFunc: any;
    loadUserData: LoadUserDataPrototype;
    clearUserData: ClearUserDataPrototype;
    loader: LoaderPrototype;
    pending: string[];
}

const App: React.FC<Props> = props => {
    const { loading, pending, userDataFunc, userData, loader, history } = props;

    React.useEffect(() => {
        props.loader(LoadTypes.USER_DATA);
        props.userDataFunc.loadUserData().then(({ settings }:UserDataType) => {
            props.loader(LoadTypes.PADARIA_NODE);
            
            rpc.load({
                nodeAddress: settings.nodeAddress,
                apiAddress: settings.apiAddress
            })
            .then(() => {
                props.loader(LoadTypes.PADARIA_NODE, true);
            })
            .catch((error:Error) => {
                console.error(error);
                props.loader(LoadTypes.PADARIA_NODE, true);
            });
        })
        .catch((e:string) => console.log(e));
    }, []);
    
    console.log(props);
    return (
        loading 
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
    )
}

// Loader
const LoaderProps = ({ loader }: LoaderState) => loader;
const LoaderDispatcher = (dispatch: Dispatch) => bindActionCreators(LoaderAction, dispatch);

// User Data
const UserDataProps = ({ userData }:{ userData:UserDataType }) => ({ userData });
const UserDataDispatchers = (dispatch: Dispatch) => ({ userDataFunc: bindActionCreators(UserDataActions, dispatch) });

export default compose(
    connect(
        LoaderProps,
        LoaderDispatcher
    ),
    connect(
        UserDataProps,
        UserDataDispatchers
    )
)(withRouter(App));
