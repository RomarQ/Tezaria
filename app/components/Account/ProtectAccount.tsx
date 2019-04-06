import React from 'react';
import { createStyles, withStyles, Theme, WithStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';

import { crypto, storage } from '../../utils/padaria';

import routes from '../../constants/routes.json';
import { SetBakerKeysPrototype, ClearUserDataPrototype } from '../../actions/userData'; 
import { KeysType } from '../../utils/padaria/types';

const styles = ({}: Theme) => createStyles({
    root: {
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        alignContent: 'center'
    },
    form: {
        margin: 50,
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
        justifyContent: 'center',
        alignContent: 'center'
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
                    variant="filled"
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
                        variant="filled"
                        InputLabelProps={{
                            shrink: true
                        }}
                    />
                )}
                <div className={classes.buttons}>
                    <Button fullWidth type="submit" >{keys.encrypted ? "Decrypt Wallet" : "Encrypt Wallet" }</Button>
                    <Button fullWidth color="secondary" onClick={onDeleteWallet}>Delete Wallet</Button>
                </div>
            </form>
        </div>
    );
}

export default withStyles(styles)(Component);
