import React from 'react';
import gql from 'graphql-tag';

import GQLclient from '../graphql-client';

import Component from '../components/Rewards/Rewards';
import { UserDataType } from '../types';
import rewardController, { DelegatorReward } from '../utils/padaria/rewardController';
import Splash from './Splash';

type Props = {
    userData: UserDataType;
};

const Container: React.FC<Props> = ({ userData }) => {
    const isMounted = React.useRef(true);
    const [rewards, setRewards] = React.useState(null);

    React.useEffect(() => {
        if (!rewards) {
            rewardController.getRewards(userData.keys.pkh, 15).then(res => {
                if (isMounted.current)
                    setRewards(res);
            });
        }
        return () => { isMounted.current = false; }
    }, []);

    const handleRewardsPayment = async (selected:DelegatorReward[], updateRewards:()=>void) => {
        const cycle = selected[0].cycle;
        const paymentsResponse = await rewardController.sendSelectedRewards(userData.keys, selected);
        
        console.log(paymentsResponse);

        GQLclient.mutate({
            mutation: gql`
                mutation insertRewards($list: [cycle_reward_payment_insert_input!]!) {
                    insert_cycle_reward_payment (
                        objects: $list
                    ) {
                        affected_rows
                    }
                }
            `,
            variables: {
                list: (
                    paymentsResponse.reduce((prev, cur) => {
                        cur.contents.forEach(transaction => {
                            prev.push({
                                cycle,
                                delegate: transaction.source,
                                delegator: transaction.destination,
                                completed: transaction.metadata.operation_result.status !== "failed"
                            });
                        });
                        return prev;
                    }, [])
                )
            }
        })
        .then((insertReward) => {
            console.log(insertReward);
            updateRewards();
        })
        .catch((error:Error) => console.error(error));

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