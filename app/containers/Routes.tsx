import React from 'react';
import { Switch, Route } from 'react-router';
import AuthRoute from '../components/CustomRoutes/AuthRoute';
import routes from '../constants/routes.json';
import HomePage from './HomePage';
import Dashboard from './Dashboard';
import Rewards from './Rewards';
import CounterPage from './CounterPage';
import ImportAccount from './Account/ImportAccount';
import Settings from '../components/Account/Settings';
import ProtectAccount from '../containers/Account/ProtectAccount';

export default (props:any) => {
    const { loader, history, userData, userDataFunc } = props;
    
    return (
        <Switch>
            <Route exact path={routes.COUNTER} component={CounterPage} />
            <AuthRoute 
                exact
                userData={userData}
                path={routes.HOME}
                render={() => (
                    <HomePage
                        userData={userData}
                        userDataFunc={userDataFunc}
                        history={history}
                    />
                )}
            />
            <AuthRoute 
                exact
                userData={userData}
                path={routes.PROTECT_ACCOUNT} 
                render={() => (
                    <ProtectAccount
                        keys={userData.keys}
                        history={history}
                        clearUserData={userDataFunc.clearUserData}
                        setBakerKeys={userDataFunc.setBakerKeys}
                    />
                )}
            />
            <AuthRoute 
                exact
                userData={userData}
                path={routes.SETTINGS}
                render={() => (
                    <Settings
                        userData={userData}
                        setBakerSettings={userDataFunc.setBakerSettings}
                    />
                )}
            />
            <AuthRoute
                exact
                userData={userData}
                path={routes.DASHBOARD}
                render={() => (
                    <Dashboard
                        userData={userData}
                        loader={loader}
                        history={history}
                    />
                )} 
            />
            <AuthRoute
                exact
                userData={userData}
                path={routes.REWARDS}
                render={() => (
                    <Rewards
                        userData={userData}
                    />
                )} 
            />
            <Route 
                exact 
                path={routes.IMPORT_ACCOUNT}
                render={() => (
                    <ImportAccount 
                        setBakerKeys={userDataFunc.setBakerKeys}
                        loader={loader}
                        history={history}
                    />
                )} 
            />
        </Switch>
    );
};
