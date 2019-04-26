import React from 'react';
import { createStyles, withStyles, Theme, WithStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Switch from '@material-ui/core/Switch';
import Typography from '@material-ui/core/Typography';

import { BakingControllerActionsProps } from '../../actions/bakingController';
import { BakingControllerStateProps } from '../../reducers/bakingController';

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
    controllerState: BakingControllerStateProps;
    controllerFunc: BakingControllerActionsProps;
} & WithStyles<typeof styles>;

const BakingController: React.FC<Props> = ({ classes, controllerState, controllerFunc, keys }) => {
    const [baking, setBaking] = React.useState(controllerState.baking);
    const [endorsing, setEndorsing] = React.useState(controllerState.endorsing);
    const [accusing, setAccusing] = React.useState(controllerState.accusing);
    const [rewarding, setRewarder] = React.useState(controllerState.accusing);

    const handleAction = () => {
        controllerState.active
            ? controllerFunc.stopController()
            : controllerFunc.startController(keys, { baking, endorsing, accusing, rewarding, logger: handleControllerLogs });
    };

    const handleControllerLogs = (log:LogProps) => {
        console.error(log);
    };

    const handleChange = (setter:any, newValue:boolean) => {
        if(!controllerState.active) {
            setter(newValue);
        }
    };

    return (
        <div className={classes.root}>
            <Button onClick={handleAction} variant="outlined" color="secondary" className={classes.button}>
                {controllerState.active ? "Stop Baking" : "Start Baking"}
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
            <div className={classes.switchRow}>
                <Typography variant="h6" className={classes.label} children="Rewarder" />
                <Switch
                    value="Rewarder"
                    checked={rewarding}
                    onChange={() => handleChange(setRewarder, !rewarding)}
                />
            </div>
        </div>
    );
}

export default withStyles(styles)(BakingController);