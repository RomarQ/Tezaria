import React from 'react';

import Component from '../components/Rewards/Rewards';
import rewarder, { DelegatorReward } from '../utils/padaria/rewarder';
import Splash from './Splash';

interface Props {
    userData: UserDataProps;
}

const Container: React.FC<Props> = ({ userData }) => {
    const isMounted = React.useRef(true);
    const [rewards, setRewards] = React.useState(null);

    React.useEffect(() => {
        if (!rewards) {
            rewarder.getRewards(userData.keys.pkh, 15)
                .then(res => isMounted.current && setRewards(res))
                .catch(e => console.error(e));
        }
        return () => { isMounted.current = false; };
    }, []);

    const handleRewardsPayment = async (selected:DelegatorReward[], updateRewards:()=>void) => {
        await rewarder.sendSelectedRewards(userData.keys, selected, selected[0].cycle);

        updateRewards();
    };

    return !rewards ? <Splash /> : (
        <Component
            pkh={userData.keys.pkh}
            handleRewardsPayment={handleRewardsPayment}
            rewards={rewards}
        />
    );
};

export default Container;
