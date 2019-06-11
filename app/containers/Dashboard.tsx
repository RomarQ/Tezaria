import React from 'react';
import Component from '../components/Dashboard/Dashboard';

import utils from '../utils/padaria/utils';
import rpc from '../utils/padaria/rpc';
import bakingController, { DelegateProps } from '../utils/padaria/bakingController';
import { BakingRight } from '../utils/padaria/baker';

interface Props {
    userData: UserDataProps;
};

export default ({ userData }:Props) => {
    const intervalDelay = React.useRef(60000/*1min*/);
    const isMounted = React.useRef(true);
    const [tezosCommits, setTezosCommits] = React.useState(null);
    const [bakerInfo, setBakerInfo] = React.useState(userData as UserDataProps & DelegateProps);
    const [chainInfo, setChainInfo] = React.useState({} as BakingRight);

    React.useEffect(() => {
        updateInfo();
        updateChainInfo();

        // Update every N seconds
        intervalDelay.current = rpc.networkConstants["time_between_blocks"] 
            ? Number(rpc.networkConstants["time_between_blocks"][0])*1000 : 60000;

        const intervalId_baker = setInterval(updateInfo, bakerInfo.balance ? 600000 : intervalDelay.current);
        
        const chainIntervalId = setInterval(updateChainInfo, 1000);
        
        return () => {
            clearInterval(intervalId_baker);
            clearInterval(chainIntervalId);
            isMounted.current = false;
        };
    }, []);

    const updateChainInfo = async () => {
        try {
            if (!chainInfo.estimated_time || (new Date(chainInfo.estimated_time).getTime() - Date.now()) < 0) {
                const level = chainInfo.level || (await rpc.getCurrentLevel()).level;
                const [nextBakingRight] = await rpc.getBakingRights(null, level+1, 1);

                isMounted.current && setChainInfo(nextBakingRight);
            }
        }
        catch(e) {}
    }

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

    return <Component
        bakerInfo={bakerInfo}
        nodeInfo={tezosCommits}
        chainInfo={chainInfo}
    />
};