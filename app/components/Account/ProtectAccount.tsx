import React from 'react';
import { History } from 'history';
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
import { crypto } from '../../utils/padaria';
import storage from '../../utils/storage';
import { LoaderPrototype, LoadTypes } from '../../actions/loader';

const styles = ({ palette }: Theme) => createStyles({
    root: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        alignContent: 'center',
        margin: 50
    },
    container: {
        backgroundColor: palette.grey[300],
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
        margin: '20px 0 0 0',
        display: 'flex',
        justifyContent: 'space-between',
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
        backgroundColor: palette.grey[400],
        padding: 5,
        marginRight: 10
    },
    pkh: {
        backgroundColor: palette.grey[400],
        margin: 10
    }
});

type Props = {
    keys: KeysType;
    history: History;
    loader: LoaderPrototype;
    clearUserData: ClearUserDataPrototype;
    setBakerKeys: SetBakerKeysPrototype;
};

const Component: React.FC<Props & WithStyles<typeof styles>> = ({ setBakerKeys, clearUserData, keys, loader, history, classes }) => {
    const isMounted = React.useRef(true);
    const [password, setPassword] = React.useState(null);
    const [passwordConfirmation, setPasswordConfirmation] = React.useState(null);
    const [modalError, setModalError] = React.useState('');

    React.useEffect(() => () => isMounted.current = false, []);

    const onDecryptedSubmit = async (e:React.FormEvent<HTMLFormElement>) =>  {
        e.preventDefault();

        if (!password && password !== passwordConfirmation) {
            setModalError("Passwords are not equal...");
            return;
        }

        (await storage.setBakerKeys(crypto.encryptSK(keys, password))).error
            ? console.error('Failed to store encrypted key on disk!')
            : history.push(routes.DASHBOARD);
    }

    const onEncryptedSubmit = async (e:React.FormEvent<HTMLFormElement>) =>  {
        e.preventDefault();

        loader(LoadTypes.USER_DATA);
        try {
            await setBakerKeys(crypto.decryptSK(keys, password));
            history.push(routes.DASHBOARD);
        }
        catch(e) {
            if (isMounted.current)
                setModalError(e.message);
        }

        loader(LoadTypes.USER_DATA, true);
    }

    const onDeleteWallet = async () => {
        await clearUserData();
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
                        className={classes.pkh}
                        variant="outlined"
                    />
                </div>
                <form className={classes.form} onSubmit={keys.encrypted ? onEncryptedSubmit : onDecryptedSubmit }>
                    {modalError ? <p>{modalError}</p> : null}
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
                            variant="outlined"
                            InputLabelProps={{
                                shrink: true
                            }}
                        />
                    )}
                    <div className={classes.buttons}>
                        <Button type="submit" variant="contained" className={classes.button} color="primary">
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
                        <Button type="button" variant="contained" className={classes.button} color="secondary" onClick={onDeleteWallet}>
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
