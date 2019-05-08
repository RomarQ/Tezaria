import React from 'react';
import Wrapper from '../components/Dashboard/Dashboard';

import utils from '../utils/padaria/utils';
import bakingController from '../utils/padaria/bakingController';

type Props = {
    userData: UserDataType;
};

const Dashboard: React.FC<Props> = ({ userData }) => {
    const isMounted = React.useRef(true);
    const [tezosCommits, setTezosCommits] = React.useState(null);

    React.useEffect(() => {
        utils.verifyNodeCommits().then(r => {
            if (isMounted.current)
                setTezosCommits(r);
        });
        return () => { isMounted.current = false; };
    }, []);

    const bakerInfo = {
        keys: userData.keys,
        ...bakingController.delegate
    };

    return <Wrapper 
        userData={userData}
        bakerInfo={bakerInfo}
        nodeInfo={tezosCommits}
    />
};

export default Dashboard;