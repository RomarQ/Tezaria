import React from 'react';

import Component from '../components/Rewards/Rewards';
import rewarder, { DelegatorReward } from '../utils/padaria/rewarder';
import Splash from './Splash';

type Props = {
    userData: UserDataType;
};

const Container: React.FC<Props> = ({ userData }) => {
    const isMounted = React.useRef(true);
    const [rewards, setRewards] = React.useState(null);

    React.useEffect(() => {
        if (!rewards) {
            rewarder.getRewards(userData.keys.pkh, 15).then(res => {
                if (isMounted.current)
                    setRewards(res);
            });
        }
        return () => { isMounted.current = false; }
    }, []);

    const handleRewardsPayment = async (selected:DelegatorReward[], updateRewards:()=>void) => {
        const paymentsResponse = await rewarder.sendSelectedRewards(userData.keys, selected, selected[0].cycle);
        
        console.log(paymentsResponse);

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