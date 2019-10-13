import React from 'react'
import {
  createStyles,
  withStyles,
  WithStyles,
  Theme
} from '@material-ui/core/styles'

import Fab from '@material-ui/core/Fab'
import SettingsIcon from '@material-ui/icons/Settings'
import Typography from '@material-ui/core/Typography'
import { History } from 'history'
import FabLink from './FabLink'
import routes from '../constants/routes.json'

import withHardwareWallet from '../providers/HardwareWallet/withHardwareWallet'
import { HardwareWalletContextInterface } from '../providers/HardwareWallet/HardwareWalletContext'

const styles = ({ palette, spacing }: Theme) =>
  createStyles({
    root: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      alignContent: 'center'
    },
    container: {
      backgroundColor: palette.background.paper,
      padding: 50,
      borderRadius: 10,
      boxShadow: '0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22)'
    },
    buttons: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      alignContent: 'center',
      marginTop: 50,
      marginBottom: 50
    },
    fab: {
      width: 220,
      margin: spacing(1)
    },
    extendedIcon: {
      marginRight: 10
    },
    logo: {
      width: 220
    },
    ledgerLogo: {
      width: 90,
      marginRight: 10
    },
    ledgerFab: {
      display: 'flex',
      flexDirection: 'column',
      margin: spacing(1)
    },
    settingsFab: {
      position: 'absolute',
      bottom: spacing(2),
      right: spacing(1)
    }
  })

interface Props extends WithStyles<typeof styles> {
  history: History
  hardwareWallet: HardwareWalletContextInterface
}

const Component: React.FC<Props> = ({ classes, history, hardwareWallet }) => {
  const isMounted = React.useRef(false)
  const [ledgerVersion, setLedgerVersion] = React.useState(null)

  React.useEffect(() => {
    isMounted.current = true

    hardwareWallet
      .getVersion()
      .then(version => isMounted.current && setLedgerVersion(version))

    return () => {
      isMounted.current = false
    }
  }, [])

  return (
    <React.Fragment>
      <div className={classes.root}>
        <div className={classes.container}>
          <img alt="logo" src="./assets/logo.png" className={classes.logo} />
          <div className={classes.buttons}>
            <FabLink
              to={routes.NEW_ACCOUNT}
              variant="extended"
              size="large"
              color="secondary"
              aria-label="new"
              className={classes.fab}
            >
              Create a new Account
            </FabLink>
            <Typography variant="caption">OR</Typography>
            <FabLink
              to={routes.IMPORT_ACCOUNT}
              variant="extended"
              size="large"
              color="secondary"
              aria-label="Import"
              className={classes.fab}
            >
              Import an Account
            </FabLink>
            <Typography variant="caption">OR</Typography>
            <FabLink
              disabled={!ledgerVersion}
              to={routes.CONNECT_HARDWARE_WALLET}
              onClick={hardwareWallet.getAddress}
              variant="extended"
              size="large"
              aria-label="Import"
              className={classes.ledgerFab}
            >
              <img
                alt="ledger"
                src="./assets/ledger.png"
                className={classes.ledgerLogo}
              />
              {ledgerVersion || 'Not Detected'}
            </FabLink>
          </div>
        </div>
      </div>
      <Fab
        aria-label="settings"
        className={classes.settingsFab}
        onClick={() => history.push(routes.SETTINGS)}
      >
        <SettingsIcon />
      </Fab>
    </React.Fragment>
  )
}

export default withStyles(styles)(withHardwareWallet(Component))
