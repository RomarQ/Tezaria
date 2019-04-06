import React from 'react';
import { createStyles, withStyles, Theme, WithStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Switch from '@material-ui/core/Switch';
import FormControlLabel from '@material-ui/core/FormControlLabel';

import { BakingControllerState, KeysType } from '../../utils/padaria/types';
import { StartControllerPrototype, StopControllerPrototype } from '../../actions/bakingController';

const styles = ({ transitions, palette, shadows }: Theme) => createStyles({
  root: {
    width: 600,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'space-around',
    alignContent: 'space-around'
  },
  label: {
    color: palette.common.white
  },
  disabled: {
    background: palette.common.white
  }
});

interface Props extends BakingControllerState {
  classes: any;
  keys: KeysType;
  startController: StartControllerPrototype;
  stopController: StopControllerPrototype;
}

const BakingController: React.SFC<Props> = props => {
  const [baking, setBaking] = React.useState(props.baking);
  const [endorsing, setEndorsing] = React.useState(props.endorsing);
  const [accusing, setAccusing] = React.useState(props.accusing);

  const { classes, active, stopController, startController, keys } = props;

  const handleAction = () => {
    active ? stopController() : startController(keys, { baking, endorsing, accusing });
  }

  const handleChange = (setter:any, newValue:boolean) => {
    if(!active) {
      setter(newValue);
    }
  }

  console.log(props)

  return (
    <div className={classes.root}>
      <Button onClick={handleAction} variant="outlined" color="secondary">{
        active ? "Stop Baking..." : "Start Baking..."
      }</Button>
      <FormControlLabel
        classes={{ label: classes.label }}
        labelPlacement="top"
        label="Baker"
        control={
          <Switch
            value="Baker"
            checked={baking}
            onChange={() => handleChange(setBaking, !baking)}
          />
        }
      />
      <FormControlLabel
        classes={{ label: classes.label }}
        labelPlacement="top"
        label="Endorser"
        control={
          <Switch
            value="Endorser"
            checked={endorsing}
            onChange={() => handleChange(setEndorsing, !endorsing)}
          />
        }
      />
      <FormControlLabel
        classes={{ label: classes.label }}
        labelPlacement="top"
        label="Accuser"
        control={
          <Switch
            value="Accuser"
            checked={accusing}
            onChange={() => handleChange(setAccusing, !accusing)}
          />
        }
      />
    </div>
  );
}

export default withStyles(styles)(BakingController);