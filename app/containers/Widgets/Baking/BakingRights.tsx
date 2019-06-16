import React from 'react';
import { bindActionCreators, Dispatch } from 'redux';
import { connect } from 'react-redux';
import Component from '../../../components/Widgets/Baking/BakingRights';
import LoggerActions, {
	LoggerActionsPrototypes,
	LogTypes
} from '../../../actions/logger';
import baker, {
	IncomingBakings,
	CompletedBaking
} from '../../../utils/padaria/baker';
import { LogOrigins } from '../../../utils/padaria/logger';

interface Props {
	pkh: string;
	logger: LoggerActionsPrototypes;
}

const Container = ({ pkh, logger }: Props) => {
	const isMounted = React.useRef(true);
	const [incomingBakings, setIB] = React.useState(null as IncomingBakings);
	const [completedBakings, setCB] = React.useState(null as CompletedBaking[]);
	React.useEffect(() => {
		getIncomingBakings();
		getCompletedBakings();

		const id = setInterval(() => {
			try {
				getIncomingBakings();
				getCompletedBakings();
			} catch (e) {
				console.error(e);
				logger.add({
					type: LogTypes.ERROR,
					message: e.message,
					origin: LogOrigins.RPC
				});
			}
		}, 20000);

		return () => {
			isMounted.current = false;
			clearInterval(id);
		};
	}, []);

	const getIncomingBakings = () => {
		baker.getIncomingBakings(pkh).then((result: IncomingBakings) => {
			if (isMounted.current && !!result) setIB(result);
		});
	};
	const getCompletedBakings = () => {
		baker.getCompletedBakings(pkh).then((result: CompletedBaking[]) => {
			if (isMounted.current && !!result) setCB(result);
		});
	};

	return (
		<Component
			incomingBakings={incomingBakings}
			completedBakings={completedBakings}
		/>
	);
};

const LoggerDispatchers = (dispatch: Dispatch) => ({
	logger: bindActionCreators(LoggerActions, dispatch)
});

export default connect(
	null,
	LoggerDispatchers
)(Container);
