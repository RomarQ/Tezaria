import React from 'react'
import {
  createStyles,
  withStyles,
  Theme,
  WithStyles
} from '@material-ui/core/styles'
import Paper from '@material-ui/core/Paper'
import Button from '@material-ui/core/Button'
import AppBar from '@material-ui/core/AppBar'
import Tabs from '@material-ui/core/Tabs'
import Tab from '@material-ui/core/Tab'
import { History } from 'history'
import ButtonLink from '../ButtonLink'

import MnemonicForm from './MnemonicForm'
import SecretKeyForm from './SecretKeyForm'

import { crypto, operations } from '../../utils/padaria'

import routes from '../../constants/routes.json'
import { SetBakerKeysPrototype } from '../../actions/userData'
import { LoaderPrototype, LoadTypes } from '../../actions/loader'
import { LoggerActionsPrototypes } from '../../actions/logger'

const styles = ({ palette }: Theme) =>
  createStyles({
    root: {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      alignContent: 'center'
    },
    paper: {
      minWidth: 500,
      maxWidth: 700,
      backgroundColor: palette.grey[300],
      border: '1px solid rgb(40, 43, 60)'
    },
    form: {
      margin: 50,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'stretch',
      alignContent: 'center'
    },
    bar: {
      backgroundColor: palette.grey[400]
    },
    buttons: {
      margin: '20px 0 0 0',
      display: 'flex',
      justifyContent: 'space-between',
      alignContent: 'stretch'
    },
    button: {
      flexBasis: '45%'
    }
  })

interface Props extends WithStyles<typeof styles> {
  handleImport: (keys: KeysProps) => void
  history: History
  setBakerKeys: SetBakerKeysPrototype
  loader: LoaderPrototype
  logger: LoggerActionsPrototypes
}

const Forms = [SecretKeyForm, MnemonicForm]

const ImportAccountForm: React.FC<Props> = props => {
  const [tab, setTab] = React.useState(0)

  const handleChange = (event: React.ChangeEvent, newValue: number) =>
    setTab(newValue)

  const { classes, setBakerKeys, loader, logger, handleImport } = props

  const SubmitFunctions = [
    // Private Key Method
    async (secret: string, passphrase?: string) => {
      loader(LoadTypes.USER_DATA)

      try {
        const keys = passphrase
          ? crypto.getKeysFromEncSeed(secret, passphrase)
          : crypto.getKeysFromDecSecret(secret)

        setBakerKeys(keys)

        handleImport(keys)
      } catch (e) {
        console.log(e)
      }

      loader(LoadTypes.USER_DATA, true)
    },
    // Mnemonic Method
    async (mnemonic: string, passphrase: string, secret?: string) => {
      loader(LoadTypes.USER_DATA)

      try {
        const keys = await crypto.getKeysFromMnemonic(mnemonic, passphrase)

        setBakerKeys(keys)

        secret &&
          operations
            .activateAccount(keys, secret)
            .then(() =>
              logger.add({
                type: 'success',
                message: 'Account activated :)'
              })
            )
            .catch(e =>
              logger.add({
                type: 'success',
                message: 'Nice, the account is already activated :)'
              })
            )

        handleImport(keys)
      } catch (e) {
        console.log(e)
      }

      loader(LoadTypes.USER_DATA, true)
    }
  ]

  const Form = Forms[tab]
  const onSubmit = SubmitFunctions[tab]

  const FormActions = (
    <div className={classes.buttons}>
      <Button
        variant="contained"
        className={classes.button}
        color="primary"
        type="submit"
      >
        Import
      </Button>
      <ButtonLink
        to={routes.HOME}
        type="button"
        variant="contained"
        className={classes.button}
        color="secondary"
      >
        Cancel
      </ButtonLink>
    </div>
  )

  return (
    <div className={classes.root}>
      <Paper elevation={12} className={classes.paper}>
        <AppBar position="static" className={classes.bar}>
          <Tabs
            textColor="secondary"
            value={tab}
            onChange={handleChange}
            indicatorColor="secondary"
            variant="fullWidth"
          >
            <Tab label="Secret Key" />
            <Tab label="Seed Words" />
          </Tabs>
        </AppBar>

        <Form
          className={classes.form}
          onSubmit={onSubmit}
          actions={FormActions}
        />
      </Paper>
    </div>
  )
}

export default withStyles(styles)(ImportAccountForm)
