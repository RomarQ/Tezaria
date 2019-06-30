import React from 'react';
import {
    createStyles,
    withStyles,
    WithStyles,
    Theme
} from '@material-ui/core/styles';

import { Typography } from '@material-ui/core';
import Eta from '../ETA';
import { BakingRight } from '../../utils/padaria/baker';


const styles = ({ palette }: Theme) => createStyles({
    root: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'stretch',
        alignContent: 'center',
        padding: 10,
        borderRadius: 10,
        backgroundColor: palette.background.paper,
        boxShadow: '0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22)',
        marginBottom: 10
    },
    chip: {
        margin: 5
    },
    flexRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    startBorder: {
        borderRadius: '10px 0 0 10px',
    },
    endBorder: {
        borderRadius: '0 10px 10px 0',
    },
    etaCounter: {
        width: 20,
        padding: 10,
        background: palette.primary.light,
        color: palette.common.white,
        fontWeight: 'bold'
    },
    nextLevel: {
        padding: 10,
        background: palette.primary.main,
        color: palette.common.white,
    },
    nextDelegate: {
        padding: 10,
        background: palette.primary.dark,
        color: palette.common.white,
    }
});

interface Props extends WithStyles<typeof styles> {
    chainInfo: BakingRight;
}

const Dashboard: React.FC<Props> = ({ classes, chainInfo }) => (chainInfo.level ? (
        <div className={classes.root}>
            <div className={`${classes.flexRow}`}>
                <Typography className={`${classes.flexRow} ${classes.etaCounter} ${classes.startBorder}`}>
                    {Eta(chainInfo.estimated_time)}
                </Typography>
                <Typography className={`${classes.flexRow} ${classes.nextLevel}`}>
                    {`Next Level ${chainInfo.level}`}
                </Typography>
                <Typography className={`${classes.flexRow} ${classes.nextDelegate} ${classes.endBorder}`}>
                    {`Delegate ${chainInfo.delegate}`}
                </Typography>
            </div>
        </div>
    ) : null);

export default withStyles(styles)(Dashboard);
