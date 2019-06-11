import React from 'react';
import {
    createStyles,
    withStyles,
    Theme,
    WithStyles
} from '@material-ui/core/styles';
import { CSSProperties } from '@material-ui/core/styles/withStyles';

import CircularProgress from '@material-ui/core/CircularProgress';
import Typography from '@material-ui/core/Typography';
import Chip from '@material-ui/core/Chip';

const styles = ({ spacing }:Theme):Record<string, CSSProperties> => createStyles({
    root: {
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-evenly',
        alignItems: 'center',
    },
    loader: {
        margin: spacing.unit * 2
    },
    loaderImg: {
        width: 128,
        background: 'url(./assets/logo.png) no-repeat center',
        backgroundSize: '40%'
    }
});

type Props = {
    waitingFor?: string[]
} & WithStyles<typeof styles>

const Splash: React.FC<Props> = ({ classes, waitingFor }) => (
    <div className={classes.root}>
        <Typography variant="h1" >Padaria</Typography>
        <div className={classes.loaderImg}>
            <CircularProgress size={100} thickness={5} className={classes.loader} color="secondary" />
        </div>
        {waitingFor && waitingFor.length > 0 ? <Chip color="secondary" variant="outlined" label={`Loading ${waitingFor}...`} /> : null}
    </div>
);

export default withStyles(styles)(Splash);
