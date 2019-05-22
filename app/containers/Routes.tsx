import React from 'react';
import { History } from 'history';
import { Switch, Route } from 'react-router';
import AuthRoute from '../components/CustomRoutes/AuthRoute';
import routes from '../constants/routes.json';
import HomePage from '../components/Home';
import Dashboard from './Dashboard';
import Rewards from './Rewards';
import ImportAccount from './Account/ImportAccount';
import NewAccount from './Account/NewAccount';
import Settings from '../components/Account/Settings';
import ProtectAccount from './Account/ProtectAccount';
import Logs from './Logs';
import { LoaderPrototype } from '../actions/loader';
import { UserDataActionsPrototypes } from '../actions/userData';
import { LoggerActionsPrototypes } from '../actions/logger';

interface Props {
    loader: LoaderPrototype;
    history: History;
    userData: UserDataProps;
    userDataFunc: UserDataActionsPrototypes;
    logger: LoggerActionsPrototypes;
}

export default ({ loader, history, userData, logger, userDataFunc }:Props) => (
    <Switch>
        <AuthRoute
            exact
            userData={userData}
            path={routes.HOME}
            render={() => <HomePage />}
        />
        <AuthRoute
            exact
            userData={userData}
            path={routes.PROTECT_ACCOUNT}
            render={() => (
                <ProtectAccount
                    keys={userData.keys}
                    loader={loader}
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
        <AuthRoute
            exact
            userData={userData}
            path={routes.LOGS}
            render={() => (
                <Logs />
            )}
        />
        <Route
            exact
            path={routes.IMPORT_ACCOUNT}
            render={() => (
                <ImportAccount
                    clearUserData={userDataFunc.clearUserData}
                    setBakerKeys={userDataFunc.setBakerKeys}
                    loader={loader}
                    history={history}
                    logger={logger}
                />
            )}
        />
        <Route
            exact
            path={routes.NEW_ACCOUNT}
            render={() => (
                <NewAccount
                    setBakerKeys={userDataFunc.setBakerKeys}
                    loader={loader}
                    history={history}
                />
            )}
        />
    </Switch>
);
