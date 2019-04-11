import React from 'react';

import Component from '../components/Rewards/Rewards';
import { UserDataType } from '../types';
import { LoaderPrototype, LoadTypes } from '../actions/loader';
import rewardController from '../utils/padaria/rewardController';
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

    return !rewards ? <Splash /> : (
        <Component pkh={userData.keys.pkh} rewards={rewards}/>
    );

};

export default Container;