import React from 'react'
import {
  createStyles,
  withStyles,
  WithStyles,
  Theme
} from '@material-ui/core/styles'

import ChainInfo from '../../containers/Dashboard/ChainInfo'
import BakerPanel from '../../containers/Dashboard/BakerPanel'
import EndorsingRights from '../../containers/Widgets/Endorsing/EndorsingRights'
import BakingRights from '../../containers/Widgets/Baking/BakingRights'
import BakingController from '../../containers/Widgets/BakingController'

const styles = ({ palette }: Theme) =>
  createStyles({
    root: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-around',
      margin: 50,
      width: '100%'
    },
    top: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'stretch',
      alignContent: 'center',
      paddingBottom: 20
    },
    widgets: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      alignContent: 'center',
      flexWrap: 'wrap'
    },
    chainInfo: {
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
    }
  })

interface Props extends WithStyles<typeof styles> {
  userData: UserDataProps
}

const Dashboard: React.FC<Props> = props => {
  const { classes, userData } = props
  return userData.keys ? (
    <div className={classes.root}>
      <ChainInfo />
      <div className={classes.top}>
        <BakerPanel userData={userData} />
        <BakingController keys={userData.keys} />
      </div>
      <div className={classes.widgets}>
        <EndorsingRights pkh={userData.keys.pkh} />
        <BakingRights pkh={userData.keys.pkh} />
      </div>
    </div>
  ) : null
}

export default withStyles(styles)(Dashboard)
