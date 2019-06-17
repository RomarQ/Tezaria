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
		orderWith: 'DelegationPhk'
	},
	{
		id: 'balance',
		label: 'Balance',
		numeric: true,
		orderWith: 'Balance'
	},
	{
		id: 'share',
		label: 'Share',
		numeric: true,
		orderWith: 'Balance'
	},
	{
		id: 'rewards_share',
		label: 'Rewards Share',
		numeric: true,
		orderWith: 'Balance'
	},
	{
		id: 'rewards_fee',
		label: 'Rewards Fee',
		numeric: true,
		orderWith: 'Balance'
	}
];

interface Props extends WithStyles<typeof styles> {
	paymentsAllowed: boolean;
	pkh: string;
	cycle: number;
	handleRewardsPayment: (
		selected: DelegatorReward[],
		cycle: number,
		updateRewards: () => void
	) => void;
}

const Component: React.FC<Props> = ({
	classes,
	pkh,
	cycle,
	paymentsAllowed,
	...props
}) => {
	const isMounted = React.useRef(true);
	const [selected, setSelected] = React.useState([] as string[]);
	const [orderBy, setOrderBy] = React.useState('Balance');
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
				if (isMounted.current) setRewards(rewards.Delegations);
			})
			.catch(e => console.error(e));
	};

	const handleRewardsPayment = () => {
		if (paymentsAllowed) {
			props.handleRewardsPayment(
				rewards.filter(r => selected.includes(r.DelegationPhk)),
				cycle,
				updateRewards
            );
            setRewards(null);
			setSelected([]);
		}
	};

	const getRow = (
		row: DelegatorReward,
		isItemSelected: boolean
	) => (
		<TableRow
			hover
			onClick={() => handleSelect(row.DelegationPhk)}
			role="checkbox"
			aria-checked={isItemSelected}
			key={row.DelegationPhk}
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
						seed={row.DelegationPhk}
						className={classes.blockie}
					/>
					<Typography variant="caption">
						{row.DelegationPhk}
					</Typography>
				</a>
			</TableCell>
			<TableCell align="right">
				<Typography variant="caption">
					{utils.parseTEZWithSymbol(
						Math.floor(row.Balance * utils.TEZ.unit)
					)}
				</Typography>
			</TableCell>
			<TableCell align="right">
				<Typography variant="caption">{`${(
					row.Share * 100
				).toLocaleString('fullwide', {
					maximumFractionDigits: 2
				})}%`}</Typography>
			</TableCell>
			<TableCell align="right">
				<Typography variant="caption">
					{utils.parseTEZWithSymbol(
						Number(row.NetRewards)
					)}
				</Typography>
			</TableCell>
			<TableCell align="right">
				<Typography variant="caption">
					{utils.parseTEZWithSymbol(
						Number(row.Fee)
					)}
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
			) : null}
		</div>
	);

	const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.checked) {
			setSelected(
				rewards.reduce((prev, cur) => (
                    !cur.paid ? [...prev, cur.DelegationPhk] : prev
                ), [])
			);
		} else setSelected([]);
	};

	const handleSelect = (key: string) => {
        //return;
        if (rewards.some(r => r.DelegationPhk === key && r.paid)) return;
        
		const selectedIndex = selected.indexOf(key);
		let newSelected: string[];

		if (selectedIndex < 0) {
			newSelected = [...selected, key];
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
            selectionFieldName="DelegationPhk"
			getActions={getActions}
			handleSelectAll={handleSelectAll}
			handleSortRequest={handleSortRequest}
			direction={direction}
			orderBy={orderBy}
		/>
	);
};

export default withStyles(styles)(Component);
