import React from 'react';
import { withStyles, createStyles, Theme, WithStyles } from '@material-ui/core/styles';
import Chip from '@material-ui/core/Chip';
import Typography from '@material-ui/core/Typography';
import Popover from '@material-ui/core/Popover';
import CheckIcon from '@material-ui/icons/Check';
import NotCheckIcon from '@material-ui/icons/CloseOutlined';
import Blockies from 'react-blockies';

import { TezosCommitState } from'../../utils/padaria/utils';

const styles = ({ palette, spacing }: Theme) => createStyles({
    root: {
        display: 'flex',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        backgroundColor: palette.background.paper,
        padding: 5,
        borderRadius: 10,
        boxShadow: '0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22)'
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
        marginRight: 10,
        backgroudColor: '#000'
    },
    labelRow: {
        display: 'flex',
        justifyContent: 'start',
        alignItems: 'center',
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
        pointerEvents: 'none',
    },
    paper: {
        padding: spacing.unit,
    },
});

type Props = {
    bakerInfo: {
        balance: string;
        keys: KeysType;
    };
    nodeInfo: TezosCommitState;
} & WithStyles<typeof styles>;

const Component: React.FC<Props> = ({ classes, bakerInfo, nodeInfo }) => {
    const [anchorEl, setAnchorEl] = React.useState(null);
    const [open, setOpen] = React.useState(null);

    const handlePopoverOpen = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        setAnchorEl(event.currentTarget);
        setOpen(event.currentTarget.id);
        console.log(event.currentTarget.id)
    };

    const handlePopoverClose = () => {
        setAnchorEl(null);
        setOpen(null);
    }

    return (
        <div className={classes.root}>
            <div className={classes.leftSection}>
                <div className={classes.labelRow}>
                    <Blockies
                        scale={10}
                        seed={bakerInfo.keys.pkh}
                        className={classes.blockie}
                    />
                    <Chip
                        label={bakerInfo.balance}
                        color="primary"
                        className={classes.margin}
                    />
                </div>
                <Chip
                    label={bakerInfo.keys.pkh}
                    variant="outlined"
                    color="primary"
                    className={classes.margin}
                />
            </div>
            <div className={classes.divider} />
            <div>
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
                }
            </div>
        </div>
    );
}

export default withStyles(styles)(Component);