import React from 'react';
import { createStyles, withStyles, Theme, WithStyles } from '@material-ui/core/styles';
import ButtonLink from '../ButtonLink';
import Button from '@material-ui/core/Button';
import Paper from '@material-ui/core/Paper';
import TextField from '@material-ui/core/TextField';
import Chip from '@material-ui/core/Chip';

import {
    crypto,
    operations
} from '../../utils/padaria';

import routes from '../../constants/routes.json';
import { SetBakerKeysPrototype } from '../../actions/userData'; 
import { LoaderPrototype, LoadTypes } from '../../actions/loader';
import { History } from 'history';
import { Typography } from '@material-ui/core';

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
    seeds: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        alignContent: 'center',
        flexWrap: 'wrap',
        marginTop: 20,
        marginBottom: 20,
        padding: 10,
        borderRadius: 10,
        backgroundColor: palette.grey[400]
    },
    form: {
        margin: 50,
        textAlign: 'center',
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
    chip: {
        margin: 5
    }
});

type Props = {
    history: History;
    setBakerKeys: SetBakerKeysPrototype;
    loader: LoaderPrototype;
} & WithStyles<typeof styles>;


const Component: React.FC<Props> = (props) => {
    const [seeds, setSeeds] = React.useState(crypto.generateMnemonic());
    const [passphrase, setPassphrase] = React.useState('');

    const { classes, setBakerKeys, loader, history } = props;
    
    const formSubmit = async (e:any) => { 
        e.preventDefault(); 
        
        loader(LoadTypes.USER_DATA);

        try {
            const keys = crypto.getKeysFromMnemonic(seeds, passphrase);
            
            await setBakerKeys(keys);

            history.push(routes.PROTECT_ACCOUNT);
            
        } catch(e) {
            console.log(e);
        }

        loader(LoadTypes.USER_DATA, true);
    }

    const copyToClipboard = () => {
        const el = document.createElement('textarea');  // Create a <textarea> element
        el.value = seeds;                               // Set its value to the string that you want copied
        el.setAttribute('readonly', '');                // Make it readonly to be tamper-proof
        el.style.position = 'absolute';                 
        el.style.left = '-9999px';                      // Move outside the screen to make it invisible
        document.body.appendChild(el);                  // Append the <textarea> element to the HTML document
        el.select();                                    // Select the <textarea> content
        document.execCommand('copy');                   // Copy - only works as a result of a user action (e.g. click events)
        document.body.removeChild(el);                  // Remove the <textarea> element
    };

    return (
        <div className={classes.root}>
            <Paper elevation={12} className={classes.paper}>
                <form className={classes.form} onSubmit={formSubmit}>

                    <Typography variant="h6">Save mnemonic seeds in a secure place, those will allow you to recover your account.</Typography>

                    <div className={classes.buttons}>
                        <Button
                            onClick={copyToClipboard}
                            type="button"
                            variant="outlined"
                            className={classes.button}
                            color="primary"
                        >
                            Copy Seeds
                        </Button>
                        <Button
                            onClick={() => setSeeds(crypto.generateMnemonic())}
                            type="button"
                            variant="outlined"
                            className={classes.button}
                            color="secondary"
                        >
                            Re-Generate Seeds
                        </Button>
                    </div>

                    <div className={classes.seeds}>
                        {seeds.split(' ').map((seed, index) => (
                            <Chip
                                key={index}
                                label={seed}
                                className={classes.chip}
                                color="primary"
                                variant="outlined"
                            />
                        ))}
                    </div>

                    <TextField
                        style={{ marginBottom: 10, color: 'rgb(108, 115, 154)' }}
                        id="passphrase"
                        label="Recommended"
                        type="password"
                        placeholder="Passphrase"
                        onChange={(e) => setPassphrase(e.target.value)}
                        fullWidth
                        variant="filled"
                        InputLabelProps={{
                            shrink: true,
                        }}
                    />

                    <div className={classes.buttons}>
                        <Button variant="contained" className={classes.button} color="primary" type="submit" >Create Wallet</Button>
                        <ButtonLink to={routes.HOME} type="button" variant="contained" className={classes.button} color="secondary"  >Cancel</ButtonLink>
                    </div>
                </form>
            </Paper>
        </div>
    );
}

export default withStyles(styles)(Component);
