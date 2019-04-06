import React from 'react';
import PropTypes from 'prop-types';
import { createStyles, withStyles, WithStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import ButtonLink from './ButtonLink';

import { UserDataType } from '../types';
import { LoaderPrototype, LoadTypes } from '../actions/loader';

import routes from '../constants/routes.json';

const styles = createStyles({
  root: {
    flexGrow: 1,
    backgroundColor: 'rgb(36, 40, 55)',
    boxSizing: 'border-box',
    border: '1px solid rgb(40, 44, 61)',
  },
  grow: {
    flexGrow: 1,
  },
  menuButton: {
    marginLeft: -12,
    marginRight: 20,
  },
});

interface Props extends WithStyles<typeof styles> {
  userData: UserDataType;
  userDataFunc: any;
  loader: LoaderPrototype;
  history: any;
}

const ButtonAppBar: React.SFC<Props> = props => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const { classes, userDataFunc:{ clearUserData }, loader, history, userData } = props;

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
          <i className="fa fa-cogs" />
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
        {!!userData ? <MenuItem onClick={handleClearKeys}>Clear Keys</MenuItem> : null }
      </Menu>
    </AppBar>
  );
}

ButtonAppBar.propTypes = {
  classes: PropTypes.object.isRequired,
} as any;

export default withStyles(styles)(ButtonAppBar);
