import React from 'react';
import Wrapper from '../components/Dashboard/Dashboard';

import utils from '../utils/padaria/utils';
import bakingController from '../utils/padaria/bakingController';

type Props = {
    userData: UserDataProps;
};

const Dashboard: React.FC<Props> = ({ userData }) => {
    const isMounted = React.useRef(true);
    const [tezosCommits, setTezosCommits] = React.useState(null);
    const [bakerInfo, setBakerInfo] = React.useState(userData);

    React.useEffect(() => {
        updateInfo();

        // Update every 10 minutes;
        const intervalId = setInterval(updateInfo, 600000);

        return () => {
            clearInterval(intervalId); 
            isMounted.current = false;
        };
    }, []);

    const updateInfo = () => {
        utils.verifyNodeCommits().then(commitState => {
            if (isMounted.current && commitState)
                setTezosCommits(commitState);
        });
        bakingController.load(userData.keys).then(delegate => {
            if (isMounted.current && delegate)
                setBakerInfo({
                    ...userData,
                    ...delegate
                });
        });
    }

    return <Wrapper
        bakerInfo={bakerInfo}
        nodeInfo={tezosCommits}
    />
};

export default Dashboard;