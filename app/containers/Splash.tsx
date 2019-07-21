import React from 'react'
import {
  createStyles,
  withStyles,
  Theme,
  WithStyles
} from '@material-ui/core/styles'

import CircularProgress from '@material-ui/core/CircularProgress'
import Typography from '@material-ui/core/Typography'
import Chip from '@material-ui/core/Chip'

import info from '../../package.json'

const styles = ({ spacing }: Theme) =>
  createStyles({
    root: {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-evenly',
      alignItems: 'center'
    },
    loader: {
      margin: spacing(1)
    },
    loaderImg: {
      width: 128,
      background: 'url(./assets/logo.png) no-repeat center',
      backgroundSize: '40%'
    }
  })

interface Props extends WithStyles<typeof styles> {
  waitingFor?: string[]
}

const Splash: React.FC<Props> = ({ classes, waitingFor }) => (
  <div className={classes.root}>
    {waitingFor && waitingFor.length > 0 ? (
      <Typography variant="h1" color="primary">
        {info.productName}
      </Typography>
    ) : null}
    <div className={classes.loaderImg}>
      <CircularProgress
        size={100}
        thickness={5}
        className={classes.loader}
        color="secondary"
      />
    </div>
    {waitingFor && waitingFor.length > 0 ? (
      <Chip
        color="secondary"
        variant="outlined"
        label={`Loading ${waitingFor}...`}
      />
    ) : null}
  </div>
)

export default withStyles(styles)(Splash)
