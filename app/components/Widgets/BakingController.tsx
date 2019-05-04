import React from 'react';
import { createStyles, withStyles, Theme, WithStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Switch from '@material-ui/core/Switch';
import Typography from '@material-ui/core/Typography';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

import NumberPicker from '../NumberPicker';

import { BakingControllerActionsProps } from '../../actions/bakingController';
import { BakingControllerStateProps } from '../../reducers/bakingController';
import rewarder from '../../utils/padaria/rewarder';

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
    const isMounted = React.useRef(true);
    const [baking, setBaking] = React.useState(controllerState.baking);
    const [endorsing, setEndorsing] = React.useState(controllerState.endorsing);
    const [accusing, setAccusing] = React.useState(controllerState.accusing);
    const [rewarding, setRewarding] = React.useState(controllerState.rewarding);
    const [rewarderStartCycle, setRewarderStartCycle] = React.useState(0);
    const [rewarderDialog, setRewarderDialog] = React.useState(false);

    React.useEffect(() => {
        rewarder.nextRewardCycle().then(cycle => isMounted.current ? setRewarderStartCycle(cycle) : null);
        return () => {
            isMounted.current = false;
        }
    }, []);

    const handleAction = () => {
        controllerState.active
            ? controllerFunc.stopController()
            : controllerFunc.startController(keys, { 
                baking,
                endorsing,
                accusing,
                rewarding,
                logger: handleControllerLogs 
            });
    };

    const handleControllerLogs = (log:LogProps) => {
        console.error(log);
    };

    const handleChange = (setter:Function, newValue:boolean) => {
        if(!controllerState.active) {
            setter(newValue);
        }
    };
    
    const handleRewarderChange = () => {
        !rewarding ? setRewarderDialog(true) : setRewarding(false);
    };

    const handleRewarderDialogCancel = () => {
        rewarder.lastRewardedCycle = undefined;
        setRewarderDialog(false);
        setRewarding(false);
    };

    const handleRewarderDialogDone = () => {
        rewarder.lastRewardedCycle = rewarderStartCycle;
        setRewarderDialog(false);
        setRewarding(true);
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
                    onChange={handleRewarderChange}
                />
                <Dialog open={rewarderDialog} onClose={handleRewarderDialogCancel} aria-labelledby="rewarder-dialog">
                    <DialogTitle id="rewarder-dialog">Rewarder Service</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Select a cycle on which you want to start sending rewards automatically. (You can only send rewards manually when this service is not running).
                        </DialogContentText>
                        <NumberPicker
                            id="rewarder-start-at"
                            required
                            label="Start sending rewards on cycle"
                            onChange={e => setRewarderStartCycle(Number(e.target.value))}
                            value={rewarderStartCycle}
                            placeholder="Cycle"
                            fullWidth
                            variant="outlined"
                            InputLabelProps={{
                                shrink: true
                            }}
                            inputProps={{
                                min: 0
                            }}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleRewarderDialogDone} color="primary">
                            Done
                        </Button>
                        <Button onClick={handleRewarderDialogCancel} color="secondary">
                            Cancel
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        </div>
    );
}

export default withStyles(styles)(BakingController);