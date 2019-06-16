import React from 'react';
import {
	withStyles,
	createStyles,
	WithStyles,
	Theme
} from '@material-ui/core/styles';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import Checkbox from '@material-ui/core/Checkbox';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import PaymentIcon from '@material-ui/icons/Payment';
import CheckIcon from '@material-ui/icons/Check';
import { Typography } from '@material-ui/core';
import Blockies from 'react-blockies';

import EnhancedTable from '../Table/EnhancedTable';
import EnhancedTableHead from '../Table/EnhancedTableHead';

import utils from '../../utils/padaria/utils';
import rewarder, { DelegatorReward } from '../../utils/padaria/rewarder';

const styles = ({ palette }: Theme) =>
	createStyles({
		root: {
			width: '100%',
			display: 'flex',
			flexDirection: 'column',
			alignContent: 'center',
			border: '2px solid #535671'
		},
		blockie: {
			width: 40,
			height: 40,
			display: 'flex',
			position: 'relative',
			overflow: 'hidden',
			flexShrink: 0,
			alignItems: 'center',
			justifyContent: 'center',
			userSelect: 'none',
			borderRadius: '50%',
			backgroundColor: '#bdbdbd',
			padding: 5,
			marginRight: 10
		},
		delegatorLink: {
			display: 'flex',
			alignItems: 'center'
		},
		actions: {
			color: palette.text.secondary
		}
	});

const columnNames = [
	{
		id: 'paid',
		label: 'Paid',
		boolean: true,
		orderWith: 'paid'
	},
	{
		id: 'delegator',
		label: 'Delegator',
		orderWith: 'pkh'
	},
	{
		id: 'delegator_balance',
		label: 'Delegator Balance',
		numeric: true,
		orderWith: 'balance'
	},
	{
		id: 'share',
		label: 'Share',
		numeric: true,
		orderWith: 'balance'
	},
	{
		id: 'rewards_share',
		label: 'Rewards Share',
		numeric: true,
		orderWith: 'balance'
	},
	{
		id: 'rewards_fee',
		label: 'Rewards Fee',
		numeric: true,
		orderWith: 'balance'
	}
];

type Props = {
	paymentsAllowed: boolean;
	pkh: string;
	cycle: number;
	handleRewardsPayment: (
		selected: DelegatorReward[],
		updateRewards: () => void
	) => void;
} & WithStyles<typeof styles>;

const Component: React.FC<Props> = ({
	classes,
	pkh,
	cycle,
	paymentsAllowed,
	...props
}) => {
	const isMounted = React.useRef(true);
	const [selected, setSelected] = React.useState([] as number[]);
	const [orderBy, setOrderBy] = React.useState('balance');
	const [direction, setDirection] = React.useState('desc' as 'asc' | 'desc');
	const [rewards, setRewards] = React.useState(null as DelegatorReward[]);

	React.useEffect(() => {
		updateRewards();
		return () => {
			isMounted.current = false;
		};
	}, []);

	const handleSortRequest = (
		event: React.MouseEvent<HTMLElement, MouseEvent>,
		property: string
	) => {
		const isDesc = orderBy === property && direction === 'desc';
		setDirection(isDesc ? 'asc' : 'desc');
		setOrderBy(property);
	};

	const updateRewards = () => {
		rewarder
			.prepareRewardsToSendByCycle(pkh, cycle)
			.then(rewards => {
				if (isMounted.current) setRewards(rewards);
			})
			.catch(e => console.error(e));
	};

	const handleRewardsPayment = () => {
		if (paymentsAllowed) {
			setRewards(null);
			props.handleRewardsPayment(
				rewards.filter(r => selected.includes(r.id)),
				updateRewards
			);
			setSelected([]);
		}
	};

	const getRow = (
		row: DelegatorReward,
		isItemSelected: boolean,
		handleClick: any
	) => (
		<TableRow
			hover
			onClick={event => handleClick(event, Number(row.id))}
			role="checkbox"
			aria-checked={isItemSelected}
			tabIndex={-1}
			key={row.id}
			selected={isItemSelected}
		>
			<TableCell padding="checkbox">
				{!row.paid ? <Checkbox checked={isItemSelected} /> : null}
			</TableCell>
			<TableCell>
				{row.paid ? <CheckIcon color="secondary" /> : null}
			</TableCell>
			<TableCell>
				<a className={classes.delegatorLink}>
					<Blockies
						seed={row.delegatorContract}
						className={classes.blockie}
					/>
					<Typography variant="caption">
						{row.delegatorContract}
					</Typography>
				</a>
			</TableCell>
			<TableCell align="right">
				<Typography variant="caption">
					{utils.parseTEZWithSymbol(row.balance)}
				</Typography>
			</TableCell>
			<TableCell align="right">
				<Typography variant="caption">{`${
					row.rewardSharePercentage
				}%`}</Typography>
			</TableCell>
			<TableCell align="right">
				<Typography variant="caption">
					{utils.parseTEZWithSymbol(row.rewardShare)}
				</Typography>
			</TableCell>
			<TableCell align="right">
				<Typography variant="caption">
					{utils.parseTEZWithSymbol(row.rewardFee)}
				</Typography>
			</TableCell>
		</TableRow>
	);

	const getActions = (numSelected: number) => (
		<div className={classes.actions}>
			{numSelected > 0 && paymentsAllowed ? (
				<Tooltip title="Send Payment">
					<IconButton
						aria-label="Send Payment"
						onClick={handleRewardsPayment}
					>
						<PaymentIcon color="secondary" />
					</IconButton>
				</Tooltip>
			) : numSelected > 0 ? (
				<Typography variant="h6" color="secondary">
					Rewards not ready yet!
				</Typography>
			) : (
				undefined
			)}
		</div>
	);

	const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.checked) {
			setSelected(
				rewards.reduce(
					(prev, cur) => (!cur.paid ? [...prev, cur.id] : prev),
					[]
				)
			);
		} else setSelected([]);
	};

	const handleSelect = (
		event: React.MouseEvent<HTMLElement, MouseEvent>,
		id: number
	) => {
		if (rewards.some(r => r.id === id && r.paid)) return;

		const selectedIndex = selected.indexOf(id);
		let newSelected: number[];

		if (selectedIndex < 0) {
			newSelected = [...selected, id];
		} else if (selectedIndex === 0) {
			newSelected = selected.slice(1);
		} else if (selectedIndex === selected.length - 1) {
			newSelected = selected.slice(0, selected.length - 1);
		} else if (selectedIndex > 0) {
			newSelected = [
				...selected.slice(0, selectedIndex),
				...selected.slice(selectedIndex + 1)
			];
		}

		setSelected(newSelected);
	};

	const CustomEnhancedTableHead = (
		<EnhancedTableHead
			columnNames={columnNames}
			numSelected={selected.length}
			direction={direction}
			orderBy={orderBy}
			onSelectAll={handleSelectAll}
			onSortRequest={handleSortRequest}
			rowCount={rewards ? rewards.filter(r => !r.paid).length : 0}
		/>
	);

	return (
		<EnhancedTable
			className={classes.root}
			tableTitle="Rewards per Delegator"
			columnNames={columnNames}
			data={rewards}
			customHead={CustomEnhancedTableHead}
			selected={selected}
			getRow={getRow}
			getActions={getActions}
			handleSelect={handleSelect}
			handleSelectAll={handleSelectAll}
			handleSortRequest={handleSortRequest}
			direction={direction}
			orderBy={orderBy}
		/>
	);
};

export default withStyles(styles)(Component);
