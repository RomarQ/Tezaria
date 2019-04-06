import React from 'react';
import { createStyles, withStyles, Theme, WithStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import TextField from '@material-ui/core/TextField';
import ButtonLink from '../ButtonLink';

import router from '../../constants/routes.json';

const styles = ({ spacing }: Theme) => createStyles({
    root: {
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        alignContent: 'center'
    },
    paper: {},
    form: {
        margin: 10,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'stretch',
        alignContent: 'center'
    }
});

const Component: React.SFC<WithStyles<typeof styles>> = ({ classes }) => {
    return (
        <div className={classes.root}>
            <Paper elevation={24} className={classes.paper}>
                <form className={classes.form}>
                    <TextField
                        style={{ marginBottom: 10 }}
                        id="seed-words"
                        required
                        multiline
                        rowsMax="2"
                        label="Required"
                        placeholder="Seed Words"
                        fullWidth
                        variant="filled"
                        InputLabelProps={{
                            shrink: true,
                        }}
                    />
                    <TextField
                        id="passphrase"
                        label="Recommended"
                        placeholder="Passphrase"
                        fullWidth
                        variant="filled"
                        InputLabelProps={{
                            shrink: true,
                        }}
                    />
                    <ButtonLink to={router.HOME} color="secondary" type="submit" >Cancel</ButtonLink>
                </form>
            </Paper>
        </div>
    );
}

export default withStyles(styles)(Component);
