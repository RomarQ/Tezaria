import React from 'react'
import {
  createStyles,
  withStyles,
  Theme,
  WithStyles
} from '@material-ui/core/styles'
import AppBar from '@material-ui/core/AppBar'
import Tabs from '@material-ui/core/Tabs'
import Tab from '@material-ui/core/Tab'
import Paper from '@material-ui/core/Paper'
import Typography from '@material-ui/core/Typography'

import Table from '../../VirtualizedTable/VirtualizedTable'
import {
  IncomingBakings,
  CompletedBaking
} from '../../../utils/padaria/baker.d'

const styles = ({ palette }: Theme) =>
  createStyles({
    root: {
      flexBasis: '48%'
    },
    title: {
      textAlign: 'center',
      backgroundColor: palette.grey[300],
      padding: 10,
      borderTopLeftRadius: 10,
      borderTopRightRadius: 10
    },
    paper: {
      display: 'flex',
      justifyContent: 'center',
      height: 400,
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0
    },
    tableHeader: {
      backgroundColor: palette.grey[300],
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
        backgroundColor: '#6E7B85'
      }
    },
    tableRowMiss: {
      display: 'flex',
      alignItems: 'center',
      backgroundColor: '#ec8f8f',
      borderBottom: '1px solid rgba(224, 224, 224, 1)'
    }
  })

const incoming_bakings_columns = [
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
    label: 'Priority',
    dataKey: 'priority',
    numeric: 'true'
  },
  {
    width: 1,
    flexGrow: 1,
    label: 'ETA',
    dataKey: 'estimated_time',
    eta: true
  }
]

const completed_bakings_columns = [
  {
    width: 1,
    flexGrow: 1,
    label: 'Cycle',
    dataKey: 'cycle',
    numeric: true
  },
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
    label: 'Priority',
    dataKey: 'priority',
    numeric: true
  },
  {
    width: 1,
    flexGrow: 1,
    label: 'Fees',
    dataKey: 'fees',
    numeric: true
  },
  {
    width: 1,
    flexGrow: 1,
    label: 'Age',
    dataKey: 'timestamp',
    eta: true
  }
]

type Props = {
  incomingBakings: IncomingBakings
  completedBakings: CompletedBaking[]
} & WithStyles<typeof styles>

const Component: React.FC<Props> = props => {
  const [tab, setTab] = React.useState(0)

  const { classes, incomingBakings, completedBakings } = props
  const handleChange = (event: any, newValue: number) => setTab(newValue)

  return (
    <div className={classes.root}>
      <Typography color="secondary" className={classes.title}>
        Baking Rights
      </Typography>
      <AppBar position="static" color="default">
        <Tabs value={tab} onChange={handleChange} variant="fullWidth">
          <Tab label="In Progress" />
          <Tab label="Completed" />
        </Tabs>
      </AppBar>

      <Paper className={classes.paper}>
        {tab === 0 ? (
          <Table
            ready={!!incomingBakings}
            headerClassName={classes.tableHeader}
            cellClassName={classes.tableCell}
            rowClassName={classes.tableRow}
            sortBy="level"
            rowCount={incomingBakings ? incomingBakings.bakings.length : 0}
            rowGetter={({ index }: any) => incomingBakings.bakings[index]}
            rowHeight={32}
            headerHeight={32}
            sortDirection="DESC"
            onRowClick={(event: any) => console.log(event)}
            columns={incoming_bakings_columns}
          />
        ) : (
          <Table
            ready={!!completedBakings}
            headerClassName={classes.tableHeader}
            cellClassName={classes.tableCell}
            rowClassName={({ index }: any) =>
              completedBakings[index] && completedBakings[index].baked
                ? classes.tableRow
                : classes.tableRowMiss
            }
            sortBy="level"
            rowCount={completedBakings ? completedBakings.length : 0}
            rowGetter={({ index }: any) => completedBakings[index]}
            rowHeight={32}
            headerHeight={32}
            sortDirection="DESC"
            onRowClick={(event: any) => console.log(event)}
            columns={completed_bakings_columns}
          />
        )}
      </Paper>
    </div>
  )
}

export default withStyles(styles)(Component)
