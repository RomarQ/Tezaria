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

import { crypto } from '../../utils/padaria';

import routes from '../../constants/routes.json';
import { SetBakerKeysPrototype } from '../../actions/userData'; 
import { LoaderPrototype, LoadTypes } from '../../actions/loader';

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
        margin: '25px 0 0px 0',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignContent: 'center'
    }
});

type Props = {
    history: any;
    setBakerKeys: SetBakerKeysPrototype;
    loader: LoaderPrototype;
} & WithStyles<typeof styles>;

const Forms = [
    MnemonicForm,
    SecretKeyForm
];

const ImportAccountForm: React.FC<Props> = (props) => {
    const [tab, setTab] = React.useState(0);
    const handleChange = (event:any, newValue:number) => setTab(newValue);

    const { classes, setBakerKeys, loader, history } = props;
    
    const SubmitFunctions = [
        // Mnemonic Method
        async (mnemonic:string, passphrase:string) => {
            try {
                const keys = crypto.getKeysFromMnemonic(mnemonic, passphrase);
                console.log(keys);
                //console.log(crypto.getKeysFromEncSecret('edesk1v7b7ieEBC7W69AB9117BZRm9PVGpahwNrDeB5yLGt2zsSYYuqJhDWBAvaoAV9eSb2XHKeaTMqV8kditNmR', '1234'))
                //console.log(crypto.seedToKeys(seed))
            } catch(e) {
                console.log(e);
            }
        },
        // Private Key Method
        async (secret:string, passphrase?:string) => {
            try {
                const keys = await (passphrase ? crypto.getKeysFromEncSeed(secret, passphrase) : crypto.getKeysFromDecSecret(secret));
                
                loader(LoadTypes.USER_DATA);
                await setBakerKeys(keys);
                loader(LoadTypes.USER_DATA);

                history.push(routes.PROTECT_ACCOUNT);
                
            } catch(e) {
                console.log(e);
            }
        }
    ];

    const Form = Forms[tab];
    const onSubmit = SubmitFunctions[tab];

    const FormActions = (
        <div className={classes.buttons}>
            <Button fullWidth type="submit" >Import</Button>
            <ButtonLink to={routes.HOME} color="secondary" fullWidth >Cancel</ButtonLink>
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
