import React from 'react';
import { withStyles, Theme, createStyles, WithStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import InputAdornment from '@material-ui/core/InputAdornment';
import Button from '@material-ui/core/Button';
import NumberPicker from '../NumberPicker';
import { UserDataType } from '../../types';
import { SetBakerSettingsPrototype } from '../../actions/userData';

const styles = ({ palette }:Theme) => createStyles({
    root: {
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
    },
    buttons: {
        margin: '25px 0 0px 0',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-evenly'
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
            <form onSubmit={handleSubmit}>
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
                    variant="filled"
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
                    variant="filled"
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
                    variant="filled"
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
                        disabled={JSON.stringify(currentSettings) === JSON.stringify(settings)}
                        variant="contained"
                        type="submit"
                        children="Save Changes"
                    />

                    <Button 
                        disabled={JSON.stringify(currentSettings) === JSON.stringify(settings)}
                        onClick={() => setSettings(currentSettings)}
                        color="secondary"
                        variant="contained"
                        children="Reset Changes"
                    />
                </div>
            </form>
        </div>
    );
}

export default withStyles(styles)(Component);