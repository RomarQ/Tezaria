import React from 'react';

import BakerPanel from '../../components/Dashboard/BakerPanel';

import rpc from '../../utils/padaria/rpc';
import utils from '../../utils/padaria/utils';
import operations from '../../utils/padaria/operations';
import bakingController, {
	DelegateProps
} from '../../utils/padaria/bakingController';

interface Props {
	userData: UserDataProps;
}

export default ({ userData }: Props) => {
	const isMounted = React.useRef(true);
	const [tezosCommits, setTezosCommits] = React.useState(null);
    const [bakerInfo, setBakerInfo] =
        React.useState(userData as UserDataProps & DelegateProps);

    React.useEffect(() => {
        isMounted.current = true;
        // Update info on first render
        updateInfo();

        return () => isMounted.current = false;;
    }, []);
    

	React.useEffect(() => {
        console.log(bakerInfo)
		// Update time interval, on every new block or 10mins
		const delay =
			rpc.networkConstants['time_between_blocks'] &&
			!bakerInfo.waitingForRights
				? Number(rpc.networkConstants['time_between_blocks'][0]) * 1000
				: 60000;

		const timeoutId = setTimeout(updateInfo, delay);

		return () => clearTimeout(timeoutId);
	}, [tezosCommits, bakerInfo]);

	const updateInfo = () => {
		utils
			.verifyNodeCommits()
			.then(commitState => {
				if (isMounted.current && commitState)
					setTezosCommits(commitState);
			})
			.catch(e => console.error(e));

		bakingController
			.load(userData.keys)
			.then(delegate => {
				if (isMounted.current && delegate)
					setBakerInfo({ ...userData, ...delegate });
			})
			.catch(e => console.error(e));
    };
    
    const activateDelegate = async () => {
        try {
            await operations.registerDelegate(bakerInfo.keys);
        } 
        catch(e) {
            console.error(e);
        }

        updateInfo();
    }

	return (
        <BakerPanel
            bakerInfo={bakerInfo}
            nodeInfo={tezosCommits}
            activateDelegate={activateDelegate}
        />
    );
};
