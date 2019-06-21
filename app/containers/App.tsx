import React from 'react';
import { compose, Dispatch, bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { RouteComponentProps } from 'react-router';
import Routes from './Routes';
import Splash from '../containers/Splash';

import rpc from '../utils/padaria/rpc';
import { LoaderState } from '../reducers/loader';
import LoaderAction, { LoadTypes, LoaderPrototype } from '../actions/loader';
import UserDataActions, {
	UserDataActionsPrototypes
} from '../actions/userData';
import LoggerActions, {
	LoggerActionsPrototypes,
	LogTypes
} from '../actions/logger';

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
	const isMounted = React.useRef(true);
	const [connectionStatus, setConnectionStatus] = React.useState(
		navigator.onLine
	);
	const {
		loading,
		pending,
		userDataFunc,
		userData,
		loader,
		history,
		logger
	} = props;

	const handleConnectionStateChange = () =>
		isMounted.current && setConnectionStatus(navigator.onLine);

	const loadRPC = async (settings: TezariaSettingsProps) => {
		loader(LoadTypes.PADARIA_NODE);

		await rpc.load({
				nodePort: settings.nodePort,
				nodeAddress: settings.nodeAddress,
				apiAddress: settings.apiAddress,
				delegatorFee: settings.delegatorFee,
				rewardsBatchSize: settings.rewardsBatchSize
			})
			.catch((e: Error) => {
				console.error(e.message);
				logger.add({
					type: LogTypes.ERROR,
					message: e.message,
					origin: LogOrigins.RPC
				});
			});

		loader(LoadTypes.PADARIA_NODE, true);
	};

	React.useEffect(() => {
		isMounted.current = true;
		loader(LoadTypes.USER_DATA);

		window.addEventListener('online', handleConnectionStateChange);
		window.addEventListener('offline', handleConnectionStateChange);

		if (userData.ready) {
			loadRPC(userData.settings).then(() => {
				loader(LoadTypes.USER_DATA, true);
			});
		} else {
			userDataFunc
				.loadUserData()
				.then(async ({ settings }) => {
					await loadRPC(settings);
					loader(LoadTypes.USER_DATA, true);
				})
				.catch((e: Error) => {
					logger.add({
						type: LogTypes.ERROR,
						message: e.message,
						origin: LogOrigins.RPC
					});

					loader(LoadTypes.USER_DATA, true);
				});
		}

		return () => {
			isMounted.current = false;
		};
	}, [connectionStatus]);

	console.log(props);
	return (
		<React.Fragment>
			<div
				id="connectionStatus"
				className={connectionStatus ? 'green' : 'red'}
			>
				{connectionStatus ? 'Online' : 'Offline'}
			</div>
			<Snackbar />
			{loading ? (
				<Splash waitingFor={pending} />
			) : (
				<React.Fragment>
					{userData.ready && !userData.keys.encrypted ? (
						<Nav
							userDataFunc={userDataFunc}
							loader={loader}
							history={history}
						/>
					) : null}
					<div id="content">
						<Routes {...props} />
					</div>
				</React.Fragment>
			)}
		</React.Fragment>
	);
};

// Loader
const LoaderProps = ({ loader }: LoaderState) => loader;
const LoaderDispatcher = (dispatch: Dispatch) =>
	bindActionCreators(LoaderAction, dispatch);

// User Data
const UserDataProps = ({ userData }: { userData: UserDataProps }) => ({
	userData
});
const UserDataDispatchers = (dispatch: Dispatch) => ({
	userDataFunc: bindActionCreators(UserDataActions, dispatch)
});

// Logger
const LoggerDispatchers = (dispatch: Dispatch) => ({
	logger: bindActionCreators(LoggerActions, dispatch)
});

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
