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
import Chip from '@material-ui/core/Chip';

import NumberPicker from '../NumberPicker';

import { BakingControllerActionsProps } from '../../actions/bakingController';
import { BakingControllerStateProps } from '../../reducers/bakingController';
import rewarder from '../../utils/padaria/rewarder';
import storage from '../../utils/storage';
import { LoggerActionsPrototypes } from '../../actions/logger';

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
    numberPicker: {
        marginTop: 40
    },
    disabled: {
        background: palette.common.white
    },
    margin: {
        margin: 10
    },
});

type Props = {
    keys: KeysType;
    controllerState: BakingControllerStateProps;
    controllerFunc: BakingControllerActionsProps;
    logger: LoggerActionsPrototypes;
} & WithStyles<typeof styles>;

const BakingController: React.FC<Props> = ({ classes, controllerState, controllerFunc, keys, logger }) => {
    const isMounted = React.useRef(true);
    const [baking, setBaking] = React.useState(controllerState.baking);
    const [endorsing, setEndorsing] = React.useState(controllerState.endorsing);
    const [accusing, setAccusing] = React.useState(controllerState.accusing);
    const [rewarding, setRewarding] = React.useState(controllerState.rewarding);
    const [rewarderStartCycle, setRewarderStartCycle] = React.useState(0);
    const [minRewardableCycle, setMinRewardableCycle] = React.useState(0);
    const [maxRewardableCycle, setMaxRewardableCycle] = React.useState(0);
    const [rewarderDialog, setRewarderDialog] = React.useState(false);

    React.useEffect(() => {

        rewarder.nextRewardCycle().then(cycle => {
            if (isMounted.current) {
                setMaxRewardableCycle(cycle);
                setRewarderStartCycle(cycle)
            }
        });

        storage.getLastRewardedCycle().then(obj => {
            if (isMounted.current)
                setMinRewardableCycle(obj.cycle)
        });

        return () => {
            isMounted.current = false;
        }
    }, []);

    // Only re-run the effect if states changes
    React.useEffect(() => {

        baking || endorsing || accusing || rewarding
        ? controllerFunc.startController(keys, { 
            baking,
            endorsing,
            accusing,
            rewarding,
            logger: handleControllerLogs 
        })
        : controllerFunc.stopController()

    }, [baking, endorsing, accusing, rewarding]);

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

    const handleControllerLogs = (log:LoggerActionProps) => {
        console.error(log);

        logger.add(log);
    };

    const handleChange = (setter:Function, newValue:boolean) => {
        setter(newValue);
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
        rewarder.lastRewardedCycle = rewarderStartCycle-1;
        setRewarderDialog(false);
        setRewarding(true);
    };
    
    return (
        <div className={classes.root}>
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
                        <DialogContentText align='justify'>
                            Select a cycle to start sending rewards automatically.
                            (You can only send rewards manually when this service is not running).
                        </DialogContentText>
                        {'Starting on cycle'}
                        <Chip
                            label={rewarderStartCycle}
                            color="primary"
                            className={classes.margin}
                        />
                        {'will verify and send every reward up to every new cycle (current cycle - ( preserved cycles + 1 ))'}
                        <Chip
                            label={`${rewarderStartCycle} ... ${maxRewardableCycle > rewarderStartCycle ? maxRewardableCycle+' ...' : '' } +∞`}
                            color="primary"
                            className={classes.margin}
                        />
                        <NumberPicker
                            className={classes.numberPicker}
                            id="rewarder-start-at"
                            required
                            label="Start sending rewards on cycle"
                            onChange={e => setRewarderStartCycle(Number(e.target.value))}
                            value={rewarderStartCycle}
                            placeholder="Cycle"
                            fullWidth
                            variant="outlined"
                            inputProps={{
                                min: minRewardableCycle,
                                max: maxRewardableCycle
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