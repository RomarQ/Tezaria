import React from 'react';
import Wrapper from '../components/Dashboard/Dashboard';

import { UserDataType } from '../types';
import rpc from '../utils/padaria/rpc';
import utils from '../utils/padaria/utils';

type Props = {
    userData: UserDataType;
};

const Dashboard: React.FC<Props> = ({ userData }) => {
    const isMounted = React.useRef(true);
    const [balance, setBalance] = React.useState('0');
    const [tezosCommits, setTezosCommits] = React.useState(null);

    React.useEffect(() => {
        rpc.getBalance(userData.keys.pkh).then(r => {
            if (isMounted.current)
                setBalance(utils.parseTEZWithSymbol(r));
        });
        utils.verifyNodeCommits().then(r => {
            if (isMounted.current)
                setTezosCommits(r);
        });
        return () => { isMounted.current = false; };
    }, []);

    const bakerInfo = {
        balance,
        keys: userData.keys
    };

    return <Wrapper 
        userData={userData}
        bakerInfo={bakerInfo}
        nodeInfo={tezosCommits}
    />
};

export default Dashboard;