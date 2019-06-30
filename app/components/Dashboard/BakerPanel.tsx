import React from 'react';
import {
	withStyles,
	createStyles,
	Theme,
	WithStyles
} from '@material-ui/core/styles';
import Chip from '@material-ui/core/Chip';
import Typography from '@material-ui/core/Typography';
import Popover from '@material-ui/core/Popover';
import CheckIcon from '@material-ui/icons/Check';
import NotCheckIcon from '@material-ui/icons/CloseOutlined';
import Blockies from 'react-blockies';

import { Button } from '@material-ui/core';
import utils, { TezosCommitProps } from '../../utils/padaria/utils';
import { DelegateProps } from '../../utils/padaria/bakingController';

const styles = ({ palette, spacing }: Theme) => createStyles({
		root: {
			display: 'flex',
			justifyContent: 'space-evenly',
			alignItems: 'center',
			backgroundColor: palette.background.paper,
			padding: 5,
			borderRadius: 10,
			boxShadow:
				'0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22)'
		},
		leftSection: {
			display: 'flex',
			flexDirection: 'column',
			justifyContent: 'center',
			alignItems: 'center',
			borderRight: '1px solid #000'
		},
		divider: {
			width: 1,
			height: '100%',
			marginLeft: 10,
			backgroudColor: '#000'
		},
		labelRow: {
			display: 'flex',
			justifyContent: 'start',
			alignItems: 'center'
		},
		blockie: {
			position: 'relative',
			display: 'flex',
			overflow: 'hidden',
			flexShrink: 0,
			alignItems: 'center',
			justifyContent: 'center',
			userSelect: 'none',
			borderRadius: '50%',
			backgroundColor: palette.grey[400],
			padding: 5,
			margin: 10
		},
		margin: {
			margin: 10
		},
		popover: {
			pointerEvents: 'none'
		},
		paper: {
			padding: spacing(1)
		}
	});

type Props = {
	bakerInfo: DelegateProps & UserDataProps;
	nodeInfo: TezosCommitProps;
	activateDelegate: () => void;
} & WithStyles<typeof styles>;

const Component: React.FC<Props> = ({
	classes,
	bakerInfo,
	nodeInfo,
	activateDelegate
}) => {
	const [anchorEl, setAnchorEl] = React.useState(null);
	const [open, setOpen] = React.useState(null);

	const handlePopoverOpen = (
		event: React.MouseEvent<HTMLDivElement, MouseEvent>
	) => {
		setAnchorEl(event.currentTarget);
		setOpen(event.currentTarget.id);
	};

	const handlePopoverClose = () => {
		setAnchorEl(null);
		setOpen(null);
	};

	const copyToClipboard = () => {
		const el = document.createElement('textarea'); // Create a <textarea> element
		el.value = bakerInfo.keys.pkh; // Set its value to the string that you want copied
		el.setAttribute('readonly', ''); // Make it readonly to be tamper-proof
		el.style.position = 'absolute';
		el.style.left = '-9999px'; // Move outside the screen to make it invisible
		document.body.appendChild(el); // Append the <textarea> element to the HTML document
		el.select(); // Select the <textarea> content
		document.execCommand('copy'); // Copy - only works as a result of a user action (e.g. click events)
		document.body.removeChild(el); // Remove the <textarea> element
	};

	return (
		<div className={classes.root}>
			<div className={classes.leftSection}>
				<div className={classes.labelRow}>
					<Blockies
						scale={10}
						seed={bakerInfo.keys.pkh}
						className={classes.blockie}
					/>

					<div className={classes.labelRow}>
						<Typography>Balance </Typography>
						<Chip
							label={
								bakerInfo.balance != 'undefined'
									? utils.parseTEZWithSymbol(
											Number(bakerInfo.balance)
									  )
									: '...'
							}
							color="primary"
							className={classes.margin}
						/>
					</div>
				</div>
				<Chip
					onClick={copyToClipboard}
					label={bakerInfo.keys.pkh}
					variant="outlined"
					color="primary"
					className={classes.margin}
				/>
			</div>
			<div className={classes.divider} />
			<div className={classes.margin}>
				{/*
                {nodeInfo ? (
                    <div
                        id="node-commits"
                        className={classes.labelRow}
                        aria-owns={open === 'node-commits' ? 'mouse-over-commits' : undefined}
                        aria-haspopup="true"
                        onMouseEnter={handlePopoverOpen}
                        onMouseLeave={handlePopoverClose}
                    >
                        <Typography variant="caption" children="Node Updated" style={{marginRight: 10}}/>
                        {nodeInfo.commitsbehind === 0 ? <CheckIcon color='primary' /> : <NotCheckIcon color='secondary' />}
                        <Popover
                            id="mouse-over-commits"
                            open={open === 'node-commits'}
                            className={classes.popover}
                            classes={{ paper: classes.paper }}
                            anchorEl={anchorEl}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'left',
                            }}
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'left',
                            }}
                            onClose={handlePopoverClose}
                            disableRestoreFocus
                        >
                            <div className={classes.labelRow}>
                                <Chip
                                    label="Commits Behind"
                                    color="secondary"
                                    className={classes.margin}
                                />
                                <Chip
                                    label={nodeInfo.commitsbehind}
                                    color="primary"
                                    className={classes.margin}
                                />
                            </div>
                            <div className={classes.labelRow}>
                                <Chip
                                    label="Current Commit"
                                    color="secondary"
                                    className={classes.margin}
                                />
                                <Chip
                                    label={nodeInfo.currentCommitHash}
                                    color="primary"
                                    className={classes.margin}
                                />
                            </div>
                            <div className={classes.labelRow}>
                                <Chip
                                    label="Last Commit"
                                    color="secondary"
                                    className={classes.margin}
                                />
                                <Chip
                                    label={nodeInfo.lastCommitHash}
                                    color="primary"
                                    className={classes.margin}
                                />
                            </div>
                        </Popover>
                    </div>
                ) : null
                } */}
				{bakerInfo.revealed != undefined && !bakerInfo.revealed ? (
					<Button
						type="button"
						variant="contained"
						color="secondary"
						disabled={bakerInfo.balance == 0}
						onClick={activateDelegate}
					>
						{'Reveal Account'}
					</Button>
				) : (
					<React.Fragment>
						<div className={classes.labelRow}>
							<Typography
								variant="caption"
								children="Legible as delegate"
								style={{ marginRight: 10 }}
							/>
							{bakerInfo.deactivated
							|| typeof bakerInfo.deactivated === 'undefined' ? (
								<NotCheckIcon color="secondary" />
							) : (
								<CheckIcon color="primary" />
							)}
						</div>
						<div className={classes.labelRow}>
							<Typography
								variant="caption"
								children="Stacking Balance"
								style={{ marginRight: 10 }}
							/>
							<Chip
								label={
									bakerInfo.staking_balance
										? utils.parseTEZWithSymbol(
												Number(
													bakerInfo.staking_balance
												)
										  )
										: '...'
								}
								color="primary"
								className={classes.margin}
							/>
						</div>
						<div className={classes.labelRow}>
							<Typography
								variant="caption"
								children="Delegators"
								style={{ marginRight: 10 }}
							/>
							<Chip
								label={
									bakerInfo.delegated_contracts
										? bakerInfo.delegated_contracts.length
										: 0
								}
								color="primary"
								className={classes.margin}
							/>
						</div>
						<div className={classes.labelRow}>
							<Typography
								variant="caption"
								children="Rolls"
								style={{ marginRight: 10 }}
							/>
							<Chip
								label={
									bakerInfo.staking_balance
										? utils.getTotalRolls(
												bakerInfo.staking_balance
										  )
										: '...'
								}
								color="primary"
								className={classes.margin}
							/>
						</div>
					</React.Fragment>
				)}
			</div>
		</div>
	);
};

export default withStyles(styles)(Component);
