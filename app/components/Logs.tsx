import React from 'react';
import { ActionCreatorsMapObject } from 'redux';
import { createStyles, withStyles, Theme, WithStyles } from '@material-ui/core';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import IconButton from '@material-ui/core/IconButton';
import Grid from '@material-ui/core/Grid';
import DeleteIcon from '@material-ui/icons/Delete';
import WarningIcon from '@material-ui/icons/WarningOutlined';
import ErrorIcon from '@material-ui/icons/ErrorOutlineOutlined';
import SuccessIcon from '@material-ui/icons/DoneOutlineOutlined';
import InfoIcon from '@material-ui/icons/InfoOutlined';

import { LoggerActionsPrototypes } from '../actions/logger';
import { LogProps } from '../reducers/logger';


const styles = ({ spacing, palette }: Theme) => createStyles({
    root: {
        margin: 50,
    },
    title: {
        margin: `${spacing.unit * 4}px 0 ${spacing.unit * 2}px`,
        textAlign: 'center'
    },
    listItem: {
        color: '#FFF',
        marginBottom: 1
    },
    error: {
        backgroundColor: '#d32f2f'
    },
    warning: {
        backgroundColor: '#ffa000'
    },
    success: {
        backgroundColor: '#43a047'
    },
    info: {
        backgroundColor: '#2979ff'
    }
});

const LogIcons = {
    error:      <ErrorIcon />,
    warning:    <WarningIcon />,
    info:       <InfoIcon />,
    success:    <SuccessIcon />
};

type Props = {
    logs: LogProps[];
    loggerActions: ActionCreatorsMapObject<LoggerActionsPrototypes>;
} & WithStyles<typeof styles>;

const Component:React.FC<Props> = ({ classes, logs }) => {
    return (
        <Grid item xs={12} md={6} className={classes.root}>
            <div>
                <List dense>
                    {logs.map(log => (
                        <ListItem key={log.key} className={`${classes[log.logType]} ${classes.listItem}`}>
                            <ListItemAvatar>
                                {LogIcons[log.logType]}
                            </ListItemAvatar>
                            <ListItemText
                                primary={log.message}
                                secondary={new Date(log.timestamp).toLocaleString()}
                            />
                            <ListItemSecondaryAction>
                                <IconButton aria-label="Delete">
                                    <DeleteIcon />
                                </IconButton>
                            </ListItemSecondaryAction>
                        </ListItem>
                    ))}
                </List>
            </div>
        </Grid>
    );
};

export default withStyles(styles)(Component);