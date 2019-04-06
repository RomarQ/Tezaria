import React from 'react';
import { createStyles, withStyles, Theme } from '@material-ui/core/styles';

import CircularProgress from '@material-ui/core/CircularProgress';
import Typography from '@material-ui/core/Typography';
import Chip from '@material-ui/core/Chip';

import app from '../constants/info';

const styles = ({ spacing }: Theme) => createStyles({
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
    background: 'url(../resources/assets/loader.png) no-repeat center',
    backgroundSize: '40%'
  }
});

type Props = {
  classes: any,
  waitingFor?: string[]
}

const Splash = ({ classes, waitingFor }: Props) => (
  <div className={classes.root}>
    <Typography variant="h1" >{app.name}</Typography>
    <div className={classes.loaderImg}>
      <CircularProgress size={100} thickness={5} className={classes.loader} color="secondary" />
    </div>
    {waitingFor && waitingFor.length > 0 ? <Chip color="secondary" variant="outlined" label={`Loading ${waitingFor}...`} /> : null}
  </div>
);

export default withStyles(styles)(Splash);
