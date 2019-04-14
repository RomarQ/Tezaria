import React from 'react';
import { withStyles, WithStyles, createStyles, Theme } from '@material-ui/core/styles';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import RewardsPerDelegator from './RewardsPerDelegator';
import utils from '../../utils/padaria/utils';
import { DelegatorReward } from '../../utils/padaria/rewardController';

const styles = ({ typography, palette }: Theme) => createStyles({
    root: {
        margin: 50,
        width: '100%'
    },
    header: {
        backgroundColor: '#535671'
    },
    heading: {
        flexBasis: "15%",
        flexShrink: 0
    },
    secondaryHeading: {
        fontSize: typography.pxToRem(15),
        color: palette.text.secondary,
    },
    status1: {
        color: '#52e559',
        flexBasis: "15%",
        flexShrink: 0
    },
    status2: {
        backgroundColor: '#afd88c',
        flexBasis: "15%",
        flexShrink: 0
    },
    status3: {
        color: '#3daced',
        flexBasis: "15%",
        flexShrink: 0
    },
    status4: {
        color: '#d88d8c',
        flexBasis: "15%"
    }
});

type Props = {
    pkh: string;
    rewards: DelegatorReward[];
    handleRewardsPayment: (selected:DelegatorReward[], updateRewards:()=>void) => void;
} & WithStyles<typeof styles>;

const Component: React.FC<Props> = props => {
    const [expanded, setExpanded] = React.useState(undefined);
    const { classes, rewards, pkh, handleRewardsPayment } = props;

    const handleChange = (panel:any) => (event:any, isExpanded:any) => {
        setExpanded(isExpanded ? panel : false);
    };

    const getStatus = (status:string) => {
        switch(status) {
            case 'cycle_pending':
                return {
                    className: classes.status1,
                    label: 'Pending'
                };
            case 'cycle_in_progress':
                return {
                    className: classes.status2,
                    label: 'In Progress'
                };
            case 'rewards_pending':
                return {
                    className: classes.status3,
                    label: 'Rewards Pending'
                };
            case 'rewards_delivered':
                return {
                    className: classes.status4,
                    label: 'Rewards Delivered'
                };
        }
    };

    return rewards ? (
        <div className={classes.root}>
            <div style={{width: '100%'}}>
                <ExpansionPanel disabled classes={{disabled: classes.header}}>
                    <ExpansionPanelSummary style={{opacity: 1}}>
                        <Typography className={classes.heading}>Cycle</Typography>
                        <Typography className={classes.heading}>Delegators</Typography>
                        <Typography className={classes.heading}>Staking Balance</Typography>
                        <Typography className={classes.heading}>Rewards</Typography>
                        <Typography className={classes.heading}>Fees</Typography>
                        <Typography className={classes.heading}>Status</Typography>
                    </ExpansionPanelSummary>
                </ExpansionPanel>
                {rewards.map((r:any, index:number) => {
                    const status = getStatus(r.status.status);
                    return (
                        <ExpansionPanel className={status.className} key={index} expanded={expanded === index} onChange={handleChange(index)}>
                            <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography className={classes.heading}>{r.cycle}</Typography>
                                <Typography className={classes.heading}>{r.delegators_nb}</Typography>
                                <Typography className={classes.heading}>
                                    {utils.parseTEZWithSymbol(r.delegate_staking_balance)}
                                </Typography>
                                <Typography className={classes.heading}>
                                    {utils.parseTEZWithSymbol(r.endorsements_rewards + r.blocks_rewards)}
                                </Typography>
                                <Typography className={classes.heading}>
                                    {utils.parseTEZWithSymbol(r.fees)}
                                </Typography>
                                <Typography className={status.className}>{status.label}</Typography>
                            </ExpansionPanelSummary>
                            <ExpansionPanelDetails>
                                <RewardsPerDelegator
                                    handleRewardsPayment={handleRewardsPayment}
                                    paymentsAllowed={r.status.status === 'rewards_delivered'} 
                                    pkh={pkh} 
                                    cycle={r.cycle}
                                />
                            </ExpansionPanelDetails>
                        </ExpansionPanel>
                    );
                })}
            </div>
        </div>
    ): undefined;
};

export default withStyles(styles)(Component);