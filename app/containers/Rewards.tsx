import React from 'react';
import gql from 'graphql-tag';
import { Query } from 'react-apollo';

import Component from '../components/Rewards/Rewards';
import { UserDataType } from '../types';
import rewardController, { DelegatorReward } from '../utils/padaria/rewardController';
import Splash from './Splash';

interface Props {
    userData: UserDataType;
}

const Container: React.FC<Props> = ({ userData }) => {
    const isMounted = React.useRef(true);
    const [rewards, setRewards] = React.useState(undefined);

    React.useEffect(() => {
        if (!rewards) {
            rewardController.getRewards(userData.keys.pkh, 15).then(res => {
                if (isMounted.current)
                    setRewards(res);
            });
        }
        return () => { isMounted.current = false; }
    }, []);

    const handleRewardsPayment = async (selected:DelegatorReward[]) => {
        console.log(await rewardController.sendSelectedRewards(userData.keys, selected));
    };

    const test = () => {
        <Query query={getRewards}>
            {(props:any) => {
                console.log(props);
                return <div/>
            }}
        </Query>
    }
    test();

    return !rewards ? <Splash /> : (
        <Component 
            pkh={userData.keys.pkh}
            handleRewardsPayment={handleRewardsPayment}
            rewards={rewards}
        />
    );

};

const getRewards = gql`{
    cycle_reward_payment {
        cycle
        delegator
        completed
    }
}`;

export default Container; 