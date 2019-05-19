import React from 'react';
import {
    createStyles,
    withStyles,
    WithStyles,
    Theme
} from '@material-ui/core/styles';
import { CSSProperties } from '@material-ui/core/styles/withStyles';

import FabLink from './FabLink';
import Typography from '@material-ui/core/Typography';
import routes from '../constants/routes.json';

const styles = ({ palette, spacing }: Theme):Record<string, CSSProperties> => createStyles({
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

const Component: React.FC<WithStyles<typeof styles>> = ({ classes }) => (
    <div className={classes.root}>
        <div className={classes.container}>
            <img alt="logo" src="../resources/assets/logo.png" className={classes.logo} />
            <div className={classes.buttons}>
                <FabLink
                    to={routes.NEW_ACCOUNT}
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
    </div>
);

export default withStyles(styles)(Component);
