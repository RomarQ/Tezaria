import React from 'react';

import Component from '../components/Rewards/Rewards';
import { UserDataType } from '../types';
import { LoaderPrototype, LoadTypes } from '../actions/loader';
import rewardController from '../utils/padaria/rewardController';
import Splash from './Splash';

interface Props {
    userData: UserDataType;
}

const Container: React.SFC<Props> = ({ userData }) => {
    const [rewards, setRewards] = React.useState(undefined);

    React.useEffect(() => {
        if (!rewards) {
            rewardController.getRewards(userData.keys.pkh, 15).then(res => {
                setRewards(res);
            });
        }
    }, []);

    return !rewards ? <Splash /> : (
        <Component pkh={userData.keys.pkh} rewards={rewards}/>
    );

};

export default Container;