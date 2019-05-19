import React from 'react';
import { createStyles, withStyles, Theme, WithStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import ButtonLink from '../ButtonLink';
import Button from '@material-ui/core/Button';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';

import MnemonicForm from './MnemonicForm';
import SecretKeyForm from './SecretKeyForm';

import {
    rpc,
    crypto,
    operations
} from '../../utils/padaria';

import routes from '../../constants/routes.json';
import { SetBakerKeysPrototype } from '../../actions/userData'; 
import { LoaderPrototype, LoadTypes } from '../../actions/loader';
import { History } from 'history';

const styles = ({ palette }: Theme) => createStyles({
    root: {
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        alignContent: 'center'
    },
    paper: {
        minWidth: 500,
        maxWidth: 700,
        backgroundColor: palette.grey[300],
        border: '1px solid rgb(40, 43, 60)'
    },
    form: {
        margin: 50,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'stretch',
        alignContent: 'center'
    },
    bar: {
        backgroundColor: palette.grey[400],
    },
    buttons: {
        margin: '20px 0 0 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignContent: 'stretch'
    },
    button: {
        flexBasis: '45%'
    }
});

type Props = {
    history: History;
    setBakerKeys: SetBakerKeysPrototype;
    loader: LoaderPrototype;
} & WithStyles<typeof styles>;

const Forms = [
    SecretKeyForm,
    MnemonicForm
];

const ImportAccountForm: React.FC<Props> = (props) => {
    const [tab, setTab] = React.useState(0);
    const handleChange = (event:any, newValue:number) => setTab(newValue);

    const { classes, setBakerKeys, loader, history } = props;
    
    const SubmitFunctions = [
        // Private Key Method
        async (secret:string, passphrase?:string) => {
            loader(LoadTypes.USER_DATA);

            try {
                const keys = (passphrase ? crypto.getKeysFromEncSeed(secret, passphrase) : crypto.getKeysFromDecSecret(secret));
                
                await setBakerKeys(keys);


                history.push(routes.PROTECT_ACCOUNT);
                
            } catch(e) {
                console.log(e);
            }

            loader(LoadTypes.USER_DATA, true);
        },
        // Mnemonic Method
        async (mnemonic:string, passphrase:string, secret?:string) => {
            loader(LoadTypes.USER_DATA);

            try {
                const keys = crypto.getKeysFromMnemonic(mnemonic, passphrase);

                await setBakerKeys(keys);

                secret && await operations.activateAccount(keys, secret);

                history.push(routes.PROTECT_ACCOUNT);

            } catch(e) {
                console.log(e);
            }

            loader(LoadTypes.USER_DATA, true);
        }
    ];

    const Form = Forms[tab];
    const onSubmit = SubmitFunctions[tab];

    const FormActions = (
        <div className={classes.buttons}>
            <Button variant="contained" className={classes.button} color="primary" type="submit" >Import</Button>
            <ButtonLink to={routes.HOME} type="button" variant="contained" className={classes.button} color="secondary"  >Cancel</ButtonLink>
        </div>
    )

    return (
        <div className={classes.root}>
            <Paper elevation={12} className={classes.paper}>
            
                <AppBar position="static" className={classes.bar}>
                    <Tabs
                        textColor="secondary"
                        value={tab}
                        onChange={handleChange}
                        indicatorColor="secondary"
                        variant="fullWidth"
                    >
                        <Tab label="Seed Words" />
                        <Tab label="Secret Key" />
                    </Tabs>
                </AppBar>

                <Form 
                    className={classes.form} 
                    onSubmit={onSubmit} 
                    actions={FormActions}
                />

            </Paper>
        </div>
    );
}

export default withStyles(styles)(ImportAccountForm);
