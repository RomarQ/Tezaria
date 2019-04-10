import React from 'react';
import { createStyles, withStyles, Theme, WithStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';

import Table from '../../VirtualizedTable/VirtualizedTable';
import { IncomingEndorsings, CompletedEndorsing } from '../../../utils/padaria/endorser.d';

interface Props extends WithStyles<typeof styles> {
  incomingEndorsings: IncomingEndorsings,
  completedEndorsings: CompletedEndorsing[]
};

const styles = ({}:Theme) => createStyles({
  root: {
    minWidth: 500,
    margin: 20
  },
  title: {
    textAlign: 'center',
    backgroundColor: '#535671',
    padding: 10,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10
  },
  paper: { 
    height: 400,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0
  },
  tableHeader: {
    backgroundColor: '#535671',
    verticalAlign: 'middle',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  tableCell: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  tableRow: {
    display: 'flex',
    alignItems: 'center',
    borderBottom: '1px solid rgba(224, 224, 224, 1)',
    '&:hover': {
      backgroundColor: '#6E7B85',
    },
  },
  tableRowMiss: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#ec8f8f',
    borderBottom: '1px solid rgba(224, 224, 224, 1)'
  }
});

const incoming_endorsings_columns = [
  {
    width: 64,
    label: 'Cycle',
    dataKey: 'cycle',
    numeric: true
  },
  {
    width: 128,
    label: 'Level',
    dataKey: 'level',
    numeric: true
  },
  {
    width: 1,
    flexGrow: 1,
    label: 'ETA',
    dataKey: 'estimated_time',
    eta: true
  },
  {
    width: 128,
    label: 'Slots',
    dataKey: 'slots',
    array: true
  }
];

const completed_endorsings_columns = [
  {
    width: 1,
    flexGrow: 1,
    label: 'Level',
    dataKey: 'level',
    numeric: true
  },
  {
    width: 1,
    flexGrow: 1,
    label: 'Slots',
    dataKey: 'lr_nslot',
    numeric: true
  },
  {
    width: 1,
    flexGrow: 1,
    label: 'Priority',
    dataKey: 'priority',
    numeric: true
  },
  {
    width: 1,
    flexGrow: 1,
    label: 'Rewards',
    dataKey: 'rewards',
    numeric: true
  },
  {
    width: 1,
    flexGrow: 1,
    label: 'Age',
    dataKey: 'timestamp',
    eta: true
  }
];

const Component: React.SFC<Props> = props => {
  const [tab, setTab] = React.useState(0);

  const { classes, incomingEndorsings, completedEndorsings } = props;
  const handleChange = (event:any, newValue:number) => setTab(newValue);

  //console.log(incomingEndorsings, completedEndorsings)

  return (
    <div className={classes.root}>
      <Typography className={classes.title}>Endorsing Rights</Typography>
      <AppBar position="static">
        <Tabs
          value={tab}
          onChange={handleChange}
          variant="fullWidth"
        >
          <Tab label="In Progress" />
          <Tab label="Completed" />
        </Tabs>
      </AppBar>


      <Paper className={classes.paper}>
        {tab === 0 ? (
          <Table
            ready={!!incomingEndorsings}
            headerClassName={classes.tableHeader}
            cellClassName={classes.tableCell}
            rowClassName={classes.tableRow}
            sortBy="level"
            rowCount={!!incomingEndorsings ? incomingEndorsings.endorsings.length : 0}
            rowGetter={({ index }:any) => incomingEndorsings.endorsings[index]}
            rowHeight={32}
            headerHeight={32}
            sortDirection="DESC"
            onRowClick={(event:any) => console.log(event)}
            columns={incoming_endorsings_columns}
          />
        ) : (
          <Table
            ready={!!completedEndorsings}
            headerClassName={classes.tableHeader}
            cellClassName={classes.tableCell}
            rowClassName={({ index }:any) => 
              completedEndorsings[index] && completedEndorsings[index].timestamp ? classes.tableRow : classes.tableRowMiss
            }
            sortBy="level"
            rowCount={!!completedEndorsings ? completedEndorsings.length : 0}
            rowGetter={({ index }:any) => completedEndorsings[index]}
            rowHeight={32}
            headerHeight={32}
            sortDirection="DESC"
            onRowClick={(event:any) => console.log(event)}
            columns={completed_endorsings_columns}
          />
        )}
      </Paper>

    </div>
  );
}

export default withStyles(styles)(Component);
