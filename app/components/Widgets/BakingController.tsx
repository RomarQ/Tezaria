import React from 'react';
import { createStyles, withStyles, Theme, WithStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Switch from '@material-ui/core/Switch';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Typography from '@material-ui/core/Typography';

import { BakingControllerState } from '../../utils/padaria/bakingController';
import { KeysType } from '../../utils/padaria/types';
import { StartControllerPrototype, StopControllerPrototype } from '../../actions/bakingController';

const styles = ({ palette }: Theme) => createStyles({
    root: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-evenly',
        alignItems: 'stretch',
        backgroundColor: palette.background.paper,
        padding: 5,
        borderRadius: 10,
        boxShadow: '0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22)'
    },
    button: {
        margin: 5
    },
    switchRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    label: {
        marginLeft: 5
    },
    disabled: {
        background: palette.common.white
    }
});

type Props = {
    keys: KeysType;
    startController: StartControllerPrototype;
    stopController: StopControllerPrototype;
} & BakingControllerState & WithStyles<typeof styles>;

const BakingController: React.FC<Props> = props => {
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

    return (
        <div className={classes.root}>
            <Button onClick={handleAction} variant="outlined" color="secondary" className={classes.button}>
                {active ? "Stop Baking" : "Start Baking"}
            </Button>
            <div className={classes.switchRow}>
                <Typography variant="h6" className={classes.label} children="Baker" />
                <Switch
                    value="Baker"
                    checked={baking}
                    onChange={() => handleChange(setBaking, !baking)}
                />
            </div>
            <div className={classes.switchRow}>
                <Typography variant="h6" className={classes.label} children="Endorser" />
                <Switch
                    value="Endorser"
                    checked={endorsing}
                    onChange={() => handleChange(setEndorsing, !endorsing)}
                />
            </div>
            <div className={classes.switchRow}>
                <Typography variant="h6" className={classes.label} children="Accuser" />
                <Switch
                    value="Accuser"
                    checked={accusing}
                    onChange={() => handleChange(setAccusing, !accusing)}
                />
            </div>
        </div>
    );
}

export default withStyles(styles)(BakingController);