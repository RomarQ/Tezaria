import React from 'react';
import { createStyles, withStyles, Theme, WithStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Chip from '@material-ui/core/Chip';
import LockOpen from '@material-ui/icons/LockOpen';
import Lock from '@material-ui/icons/LockOutlined';
import Delete from '@material-ui/icons/DeleteOutlined';

import Blockies from 'react-blockies';

import routes from '../../constants/routes.json';
import { SetBakerKeysPrototype, ClearUserDataPrototype } from '../../actions/userData'; 
import { KeysType } from '../../utils/padaria/types';
import { crypto, storage } from '../../utils/padaria';

const styles = ({palette}: Theme) => createStyles({
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
    header: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        alignContent: 'center',
        marginBottom: 20
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'stretch',
        alignContent: 'center'
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
    blockie: {
        position: 'relative',
        display: 'flex',
        overflow: 'hidden',
        flexShrink: 0,
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        borderRadius: '50%',
        backgroundColor: '#bdbdbd',
        padding: 5,
        marginRight: 10
    },
    pkh: {
        margin: 10
    }
});

type Props = {
    keys: KeysType;
    history: any;
    clearUserData: ClearUserDataPrototype;
    setBakerKeys: SetBakerKeysPrototype;
};

const Component: React.SFC<Props & WithStyles<typeof styles>> = ({ setBakerKeys, clearUserData, keys, history, classes, ...props }) => {
    const [password, setPassword] = React.useState(null);
    const [passwordConfirmation, setPasswordConfirmation] = React.useState(null);
    const [modalError, setModalError] = React.useState(null);

    const onDecryptedSubmit = () =>  {
        if (!password && password !== passwordConfirmation) {
            setModalError("Passwords are not equal...");
            return;
        }

        storage.setBakerKeys(crypto.encryptSK(keys, password));
        
        history.push(routes.DASHBOARD);
    }

    const onEncryptedSubmit = () =>  {
        setBakerKeys(crypto.decryptSK(keys, password));
        
        history.push(routes.DASHBOARD);
    }

    const onDeleteWallet = () => {
        clearUserData();
        history.push(routes.HOME);
    }

    return (
        <div className={classes.root}>
            <div className={classes.container}>
                <div className={classes.header}>
                    <Blockies
                        scale={10}
                        seed={keys.pkh}
                        className={classes.blockie}
                    />
                    <Chip
                        label={keys.pkh}
                        color="secondary"
                        className={classes.pkh}
                    />
                </div>
                <form className={classes.form} onSubmit={keys.encrypted ? onEncryptedSubmit : onDecryptedSubmit }>
                    {modalError ? <p>{modalError}</p> : undefined}
                    <TextField
                        style={{ marginBottom: 10 }}
                        id="password"
                        required
                        label="Required"
                        type="password"
                        placeholder="Password"
                        onChange={(e) => setPassword(e.target.value)}
                        fullWidth
                        variant="outlined"
                        InputLabelProps={{
                            shrink: true
                        }}
                    />
                    {keys.encrypted ? undefined : (
                        <TextField
                            id="passwordConfirmation"
                            required
                            label="Required"
                            type="password"
                            placeholder="Password Confirmation"
                            onChange={(e) => setPasswordConfirmation(e.target.value)}
                            fullWidth
                            variant="outlined"
                            InputLabelProps={{
                                shrink: true
                            }}
                        />
                    )}
                    <div className={classes.buttons}>
                        <Button variant="outlined" className={classes.button} type="submit" >
                            {keys.encrypted ? (
                                <React.Fragment>
                                    <LockOpen />
                                    {"Decrypt Wallet"}
                                </React.Fragment>
                            ) : (
                                <React.Fragment>
                                    <Lock />
                                    {"Encrypt Wallet"}
                                </React.Fragment>
                            )}
                        </Button>
                        <Button variant="outlined" className={classes.button} color="secondary" onClick={onDeleteWallet}>
                            <Delete />
                            {"Delete Wallet"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default withStyles(styles)(Component);
