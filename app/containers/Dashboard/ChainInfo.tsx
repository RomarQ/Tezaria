import React from 'react';
import Component from '../../components/Dashboard/ChainInfo';

import rpc from '../../utils/padaria/rpc';
import { BakingRight } from '../../utils/padaria/baker';

export default () => {
	const isMounted = React.useRef(true);
	const [chainInfo, setChainInfo] = React.useState({} as BakingRight);

	React.useEffect(() => {
		isMounted.current = true;

		if (!chainInfo.delegate) {
			// Update chain info on first render
			updateInfo();
			return () => (isMounted.current = false);
		}

		const delay = new Date(chainInfo.estimated_time).getTime() - Date.now();
		const timeoutId = setTimeout(updateInfo, delay > 1000 ? delay : 1000);
		return () => {
			clearInterval(timeoutId);
			isMounted.current = false;
		};
	}, [chainInfo]);

	const updateInfo = async () => {
		try {
			let level = (await rpc.getCurrentLevel()).level;

			if (level < chainInfo.level) level = chainInfo.level;

			const [nextBakingRight] = await rpc.getBakingRights(
				null,
				level + 1,
				1
			);

			isMounted.current && setChainInfo(nextBakingRight);
		} catch (e) {
			console.error(e);
		}
	};

	return <Component chainInfo={chainInfo} />;
};
