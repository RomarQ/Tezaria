import React from 'react'
import {
  withStyles,
  Theme,
  createStyles,
  WithStyles
} from '@material-ui/core/styles'
import TextField from '@material-ui/core/TextField'
import InputAdornment from '@material-ui/core/InputAdornment'
import Button from '@material-ui/core/Button'
import PayIcon from '@material-ui/icons/PaymentOutlined'
import ClearIcon from '@material-ui/icons/DeleteOutlineOutlined'

import utils from '../../utils/padaria/utils'
import operations from '../../utils/padaria/operations'

const styles = ({ palette, spacing }: Theme) =>
  createStyles({
    root: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      alignContent: 'center',
      margin: 50
    },
    container: {
      backgroundColor: palette.background.paper,
      padding: 50,
      borderRadius: 10,
      boxShadow: '0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22)'
    },
    buttons: {
      margin: '20px 0 0 0',
      display: 'flex',
      justifyContent: 'space-between',
      alignContent: 'stretch'
    },
    button: {
      flexBasis: '45%'
    },
    buttonIcon: {
      paddingRight: spacing(1)
    },
    section: {
      margin: '20px 0 0 0',
      display: 'flex',
      justifyContent: 'space-between',
      alignContent: 'stretch'
    },
    balance: {
      border: '2px',
      borderColor: palette.primary.main,
      textAlign: 'center',
      padding: 10,
      marginBottom: 20,
      borderRadius: 10,
      boxShadow: '0 1px 1px rgba(0,0,0,0.30), 0 1px 1px rgba(0,0,0,0.22)'
    },
    operation: {
      backgroundColor: '#9cdb64',
      textAlign: 'center',
      padding: 10,
      borderRadius: 10,
      marginBottom: 20,
      boxShadow: '0 1px 1px rgba(0,0,0,0.30), 0 1px 1px rgba(0,0,0,0.22)'
    }
  })

interface Props extends WithStyles<typeof styles> {
  updateContract: () => void
  contract: ContractProps
  keys: KeysProps
}

const Component: React.FC<Props> = ({
  contract,
  updateContract,
  keys,
  classes
}) => {
  const isMounted = React.useRef(true)
  const [transactions, setTransactions] = React.useState([
    {}
  ] as TransactionDestination[])
  const [operationResult, setOperationResult] = React.useState(null as string)

  React.useEffect(() => () => (isMounted.current = false), [])

  const handleChange = (
    index: number,
    e: React.ChangeEvent<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    e.preventDefault()

    try {
      const tClone = JSON.parse(JSON.stringify(transactions))
      tClone[index][e.target.id] = e.target.value

      isMounted.current && setTransactions(tClone)
    } catch (e) {
      console.log(e)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    setOperationResult(null)

    try {
      const transaction = (await operations.transaction(
        keys.pkh,
        transactions,
        keys
      ))[0]

      if (
        !transaction ||
        transaction.contents.some(
          c => c.metadata.operation_result.status != 'applied'
        )
      ) {
        isMounted.current && setOperationResult('Transaction failed!')
      } else {
        isMounted.current &&
          setOperationResult(`Transaction Sucessful: ${transaction.hash}`)
        isMounted.current && setTransactions([{}] as TransactionDestination[])
      }
      updateContract()
    } catch (e) {
      console.log(e)
    }
  }

  const handleClear = () => {
    isMounted.current && setTransactions([{}] as TransactionDestination[])
    isMounted.current && setOperationResult(null)
  }

  return (
    <div className={classes.root}>
      <form className={classes.container} onSubmit={handleSubmit}>
        <div className={classes.balance}>
          {`Balance: ${utils.parseTEZWithSymbol(Number(contract.balance))}`}
        </div>
        {operationResult && (
          <div className={classes.operation}>{operationResult}</div>
        )}
        {transactions.map((transaction, index) => (
          <div className={classes.section} key={index}>
            <TextField
              style={{ marginBottom: 10, flexBasis: '45%' }}
              id="destination"
              required
              label="Contract address"
              type="text"
              onChange={e => handleChange(index, e)}
              value={transaction.destination || ''}
              placeholder="Contract address"
              fullWidth
              variant="outlined"
              InputLabelProps={{
                shrink: true
              }}
            />
            <TextField
              style={{ marginBottom: 10, flexBasis: '50%' }}
              id="amount"
              required
              label="Amount"
              type="number"
              onChange={e => handleChange(index, e)}
              value={transaction.amount ? Number(transaction.amount) : ''}
              placeholder="Amount"
              fullWidth
              variant="outlined"
              InputLabelProps={{
                shrink: true
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment
                    style={{
                      width: 100
                    }}
                    disableTypography
                    disablePointerEvents
                    position="end"
                  >
                    {utils.parseTEZWithSymbol(
                      transaction.amount ? Number(transaction.amount) : 0
                    )}
                  </InputAdornment>
                )
              }}
              inputProps={{
                min: 0,
                max: contract.balance
              }}
            />
          </div>
        ))}
        <div className={classes.buttons}>
          <Button className={classes.button} variant="outlined" type="submit">
            <PayIcon className={classes.buttonIcon} /> {'Send'}
          </Button>

          <Button
            className={classes.button}
            onClick={handleClear}
            color="secondary"
            variant="outlined"
          >
            <ClearIcon className={classes.buttonIcon} /> {'Clear'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default withStyles(styles)(Component)
