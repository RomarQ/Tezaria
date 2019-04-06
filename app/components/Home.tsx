import React from 'react';
import { createStyles, withStyles, WithStyles, Theme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';

import FabLink from './FabLink';
import routes from '../constants/routes.json';

const styles = ({ spacing }: Theme) => createStyles({
    root: {
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        alignContent: 'center'
    },
    buttons: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        alignContent: 'center',
        marginTop: 50,
        marginBottom: 50
    },
    fab: {
        width: 220,
        margin: spacing.unit,
    },
    extendedIcon: {
        marginRight: 10
    },
    logo: {
        width: 220
    }
});

const Component: React.FC<WithStyles<typeof styles>> = props => {
    const { classes } = props;

    return (
        <div className={classes.root}>
            <img src="../resources/assets/loader.png" className={classes.logo} />
            <div className={classes.buttons}>
                <FabLink
                    to={routes.COUNTER}
                    variant="extended"
                    size="large"
                    color="secondary"
                    aria-label="new"
                    className={classes.fab}
                >
                    Create a new Account
                </FabLink>
                <Typography variant="caption">OR</Typography>
                <FabLink
                    to={routes.IMPORT_ACCOUNT}
                    variant="extended"
                    size="large"
                    color="secondary"
                    aria-label="Import"
                    className={classes.fab}
                >
                    Import an Account
                </FabLink>
            </div>
        </div>
    );
}

export default withStyles(styles)(Component);
