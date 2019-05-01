import React from 'react';
import { withStyles, Theme, createStyles, WithStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import InputAdornment from '@material-ui/core/InputAdornment';
import Button from '@material-ui/core/Button';
import SaveIcon from '@material-ui/icons/SaveOutlined';
import RedoIcon from '@material-ui/icons/Redo';
import NumberPicker from '../NumberPicker';
import { UserDataType } from '../../types';
import { SetBakerSettingsPrototype } from '../../actions/userData';

const styles = ({ palette, spacing }:Theme) => createStyles({
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
        margin: '25px 0 0px 0',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignContent: 'stretch'
    },
    button: {
        flexBasis: '45%'
    },
    buttonIcon: {
        paddingRight: spacing.unit
    },
    label: {
        color: palette.common.white
    }
});

interface Props extends WithStyles<typeof styles> {
    userData: UserDataType;
    setBakerSettings: SetBakerSettingsPrototype;
}

const Component: React.SFC<Props> = props => {
    const [settings, setSettings] = React.useState(props.userData.settings);
    const { classes, setBakerSettings, userData: { settings:currentSettings } } = props;

    const handleChange = (e:React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();

        setSettings({
            ...settings,
            [e.target.id]: e.target.value
        });
    }

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        setBakerSettings(settings);
    }

    return (
        <div className={classes.root}>
            <form className={classes.container} onSubmit={handleSubmit}>
                <TextField
                    style={{ marginBottom: 10 }}
                    id="nodeAddress"
                    required
                    label="Node Address"
                    type="text"
                    onChange={handleChange}
                    value={settings.nodeAddress || ''}
                    placeholder="Node Address"
                    fullWidth
                    variant="outlined"
                    InputLabelProps={{
                        shrink: true
                    }}
                />
                <TextField
                    style={{ marginBottom: 10 }}
                    id="apiAddress"
                    required
                    label="API Address"
                    type="text"
                    onChange={handleChange}
                    value={settings.apiAddress || ''}
                    placeholder="API Address"
                    fullWidth
                    variant="outlined"
                    InputLabelProps={{
                        shrink: true
                    }}
                />
                <TextField
                    style={{ marginBottom: 10 }}
                    id="tzScanAddress"
                    required
                    label="TzScan Address"
                    type="text"
                    onChange={handleChange}
                    value={settings.tzScanAddress || ''}
                    placeholder="TzScan Address"
                    fullWidth
                    variant="outlined"
                    InputLabelProps={{
                        shrink: true
                    }}
                />
                <NumberPicker
                    id="delegatorFee"
                    required
                    label="Delegator Fee"
                    onChange={handleChange}
                    value={settings.delegatorFee}
                    placeholder="Delegator Fee"
                    fullWidth
                    variant="outlined"
                    InputLabelProps={{
                        shrink: true
                    }}
                    InputProps={{
                        endAdornment: <InputAdornment disableTypography disablePointerEvents position="end">%</InputAdornment>,
                    }}
                    inputProps={{
                        min: 0,
                        max: 100
                    }}
                />
                <div className={classes.buttons}>
                    <Button
                        className={classes.button}
                        disabled={JSON.stringify(currentSettings) === JSON.stringify(settings)}
                        variant="outlined"
                        type="submit"
                    >
                        <SaveIcon className={classes.buttonIcon}/> {"Save Changes"}
                    </Button>

                    <Button
                        className={classes.button}
                        disabled={JSON.stringify(currentSettings) === JSON.stringify(settings)}
                        onClick={() => setSettings(currentSettings)}
                        color="secondary"
                        variant="outlined"
                    >
                        <RedoIcon className={classes.buttonIcon}/> {"Reset Changes"}
                    </Button>
                </div>
            </form>
        </div>
    );
}

export default withStyles(styles)(Component);