import React from 'react';

import Component from '../components/Rewards/Rewards';
import rewarder, { DelegatorReward } from '../utils/padaria/rewarder';
import Splash from './Splash';

interface Props {
	userData: UserDataProps;
}

const Container: React.FC<Props> = ({ userData }) => {
	const isMounted = React.useRef(true);
	const [rewards, setRewards] = React.useState([]);

	React.useEffect(() => {
		if (rewards.length === 0) {
			let r = [] as any[];
			rewarder
				.getRewards(userData.keys.pkh, 8)
				.then(
					rewardsPerCycle =>
						isMounted.current && setRewards(rewardsPerCycle)
				)
				.catch(e => console.error(e));
		}

		return () => {
			isMounted.current = false;
		};
	}, []);

	const handleRewardsPayment = async (
		selected: DelegatorReward[],
		cycle: number,
		updateRewards: () => void
	) => {
		await rewarder.sendSelectedRewards(userData.keys, selected, cycle);

		updateRewards();
	};

	return !rewards ? (
		<Splash />
	) : (
		<Component
			pkh={userData.keys.pkh}
			handleRewardsPayment={handleRewardsPayment}
			rewards={rewards}
		/>
	);
};

export default Container;
