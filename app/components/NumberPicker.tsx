import React from 'react'
import { withStyles, Theme, createStyles } from '@material-ui/core/styles'
import TextField, { TextFieldProps } from '@material-ui/core/TextField'

const styles = ({ palette }: Theme) =>
  createStyles({
    root: {
      flexDirection: 'row'
    }
  })

const Component: React.SFC<TextFieldProps> = ({
  classes,
  ...TextFieldProps
}) => {
  if (!TextFieldProps.variant) TextFieldProps.variant = 'filled'

  return (
    <TextField
      {...TextFieldProps}
      classes={{ root: classes.root }}
      style={{ marginBottom: 10 }}
      type="number"
    />
  )
}

export default withStyles(styles)(Component)
