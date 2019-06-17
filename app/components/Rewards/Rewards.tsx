import React from 'react';
import {
	withStyles,
	WithStyles,
	createStyles,
	Theme
} from '@material-ui/core/styles';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import RewardsPerDelegator from './RewardsPerDelegator';
import utils from '../../utils/padaria/utils';
import {
	RewardsReportWithoutDelegations,
	DelegatorReward
} from '../../utils/padaria/rewarder';

const styles = ({ typography, palette }: Theme) =>
	createStyles({
		root: {
			margin: 50,
			width: '100%'
		},
		header: {
			backgroundColor: '#535671'
		},
		heading: {
			flexBasis: '15%',
			flexShrink: 0
		},
		secondaryHeading: {
			fontSize: typography.pxToRem(15),
			color: palette.text.secondary
		},
		status1: {
			color: '#52e559',
			flexBasis: '15%',
			flexShrink: 0
		},
		status2: {
			backgroundColor: '#afd88c',
			flexBasis: '15%',
			flexShrink: 0
		},
		status3: {
			color: '#3daced',
			flexBasis: '15%',
			flexShrink: 0
		},
		status4: {
			color: '#d88d8c',
			flexBasis: '15%'
		}
	});

interface Props extends WithStyles<typeof styles> {
	pkh: string;
	rewards: RewardsReportWithoutDelegations[];
	handleRewardsPayment: (
		selected: DelegatorReward[],
		cycle: number,
		updateRewards: () => void
	) => void;
};

const Component: React.FC<Props> = props => {
	const [expanded, setExpanded] = React.useState(undefined);
	const { classes, rewards, pkh, handleRewardsPayment } = props;

	const handleChange = (panel: any) => (event: any, isExpanded: any) => {
		setExpanded(isExpanded ? panel : false);
	};

	const getStatus = (index: number) => {
		if (index > 4) {
			return {
				className: classes.status4,
				label: 'Rewards Delivered'
			};
		}
		return {
			className: classes.status3,
			label: 'Rewards Pending'
		};
    };
    
	return rewards ? (
		<div className={classes.root}>
			<div style={{ width: '100%' }}>
				<ExpansionPanel disabled classes={{ disabled: classes.header }}>
					<ExpansionPanelSummary style={{ opacity: 1 }}>
						<Typography className={classes.heading}>
							Cycle
						</Typography>
						<Typography className={classes.heading}>
							Delegators
						</Typography>
						<Typography className={classes.heading}>
							Rewards
						</Typography>
						<Typography className={classes.heading}>
							Status
						</Typography>
					</ExpansionPanelSummary>
				</ExpansionPanel>
				{rewards.map(
					(r: RewardsReportWithoutDelegations, index: number) => {
						const status = getStatus(index);
						return (
							<ExpansionPanel
								className={status.className}
								key={index}
								expanded={expanded === index}
								onChange={handleChange(index)}
							>
								<ExpansionPanelSummary
									expandIcon={<ExpandMoreIcon />}
								>
									<Typography className={classes.heading}>
										{r.Cycle}
									</Typography>
									<Typography className={classes.heading}>
										{r.TotalDelegations}
									</Typography>
									<Typography className={classes.heading}>
										{utils.parseTEZWithSymbol(
											Number(r.CycleRewards)
										)}
									</Typography>
									<Typography className={status.className}>
										{status.label}
									</Typography>
								</ExpansionPanelSummary>
								<ExpansionPanelDetails>
									{expanded === index ? (
										<RewardsPerDelegator
											handleRewardsPayment={
												handleRewardsPayment
											}
											paymentsAllowed={index > 5}
											pkh={pkh}
											cycle={r.Cycle}
										/>
									) : (
										<span />
									)}
								</ExpansionPanelDetails>
							</ExpansionPanel>
						);
					}
				)}
			</div>
		</div>
	) : (
		undefined
	);
};

export default withStyles(styles)(Component);
