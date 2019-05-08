import React from 'react';
import { History } from 'history';
import { createStyles, withStyles, WithStyles, Theme } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import LockIcon from '@material-ui/icons/LockOutlined';
import DeleteIcon from '@material-ui/icons/DeleteOutlined';
import LogsIcon from '@material-ui/icons/ListAlt';
import SettingsIcon from '@material-ui/icons/Settings';

import ButtonLink from './ButtonLink';

import { LoaderPrototype, LoadTypes } from '../actions/loader';
import { UserDataActionsProps } from '../actions/userData';

import routes from '../constants/routes.json';


const styles = ({ spacing }: Theme) => createStyles({
    root: {
        backgroundColor: 'rgb(36, 40, 55)',
        boxSizing: 'border-box',
        border: '1px solid rgb(40, 44, 61)'
    },
    grow: {
        flexGrow: 1
    },
    menuButton: {
        marginLeft: -12,
        marginRight: 20
    },
    buttonIcon: {
        paddingRight: spacing.unit
    }
});

type Props = {
    userDataFunc: UserDataActionsProps;
    loader: LoaderPrototype;
    history: History;
} & WithStyles<typeof styles>;

const Component: React.FC<Props> = props => {
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);
    const { classes, userDataFunc:{ clearUserData, loadUserData }, loader, history } = props;

    const handleMenuClick = (event:any) => {
        setAnchorEl(event.currentTarget);
    }

    const handleMenuClose = (event:any) => {
        setAnchorEl(null);
    }

    const handleClearKeys = () => {
        loader(LoadTypes.USER_DATA);
        clearUserData();
        history.push(routes.HOME);
    }

    const handleBakerLock = () => {
        loader(LoadTypes.USER_DATA);
        loadUserData();
    }
    
    return (
        <AppBar position="static" className={classes.root}>
            <Toolbar>
                <IconButton 
                    className={classes.menuButton} 
                    color="inherit" 
                    aria-haspopup="true" 
                    aria-label="Menu"
                    onClick={handleMenuClick}
                >
                    <i className="fa fa-bars" />
                </IconButton>
                <ButtonLink color="inherit" to={routes.DASHBOARD} className={classes.grow}>
                    Dashboard
                </ButtonLink>
                <ButtonLink color="inherit" to={routes.REWARDS} className={classes.grow}>
                    Reward System
                </ButtonLink>
                <IconButton color="inherit" aria-label="Settings" onClick={() => history.push(routes.SETTINGS)}>
                    <SettingsIcon />
                </IconButton>
                <IconButton color="inherit" aria-label="Logs" onClick={() => history.push(routes.LOGS)}>
                    <LogsIcon color="secondary"/>
                </IconButton>
            </Toolbar>
            <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                open={open}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={handleBakerLock}>
                    <LockIcon className={classes.buttonIcon}/> {"Lock Account"}
                </MenuItem>
                <MenuItem onClick={handleClearKeys}>
                    <DeleteIcon className={classes.buttonIcon}/> {"Clear Wallet"}
                </MenuItem>
            </Menu>
        </AppBar>
    );
}

export default withStyles(styles)(Component);
