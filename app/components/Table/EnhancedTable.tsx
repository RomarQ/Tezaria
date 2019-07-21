import React from 'react'
import { withStyles, createStyles, WithStyles } from '@material-ui/core/styles'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TablePagination from '@material-ui/core/TablePagination'
import TableRow from '@material-ui/core/TableRow'
import Paper from '@material-ui/core/Paper'
import CircularProgress from '@material-ui/core/CircularProgress'

import EnhancedTableToolbar from './EnhancedTableToolbar'
import EnhancedTableHead from './EnhancedTableHead'

const styles = () =>
  createStyles({
    root: {
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignContent: 'center'
    },
    table: {
      minWidth: 1020
    },
    tableWrapper: {
      overflowX: 'auto'
    },
    progress: {
      alignSelf: 'center',
      margin: 40
    }
  })

interface Props extends WithStyles<typeof styles> {
  tableTitle: string
  selectionFieldName: string
  columnNames: {
    id: string
    numeric?: boolean
    disablePadding?: boolean
    label?: string
    orderWith: string
  }[]
  selected: (string | number)[]
  data: any[]
  handleSelectAll: (event: React.ChangeEvent<HTMLInputElement>) => void
  getRow: (row: any, isItemSelected: boolean) => React.ReactChild
  getActions: (numSelected: number) => React.ReactChild
  className: string
  handleSortRequest: (
    event: React.MouseEvent<HTMLElement, MouseEvent>,
    property: string
  ) => void
  direction: 'asc' | 'desc'
  orderBy: string
  customHead?: React.ReactChild
}

const Component: React.FC<Props> = props => {
  const [page, setPage] = React.useState(0)
  const [rowsPerPage, setRowsPerPage] = React.useState(5)

  const {
    classes,
    columnNames,
    getRow,
    tableTitle,
    data,
    selected,
    className,
    getActions,
    handleSelectAll,
    handleSortRequest,
    direction = 'asc',
    orderBy,
    customHead,
    selectionFieldName
  } = props

  const stableSort = () =>
    data.sort((a, b) => (direction === 'desc' ? desc(a, b) : -desc(a, b)))

  const desc = (a: any, b: any) => {
    if (a[orderBy] === b[orderBy]) {
      return data.indexOf(a) - data.indexOf(b)
    }
    if (Number(a[orderBy]) < Number(b[orderBy])) return 1
    if (Number(a[orderBy]) > Number(b[orderBy])) return -1

    return 0
  }

  const handleChangePage = (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
    page: number
  ) => {
    setPage(page)
  }

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(Number(event.target.value))
  }

  const isSelected = (key: string | number) => selected.indexOf(key) !== -1

  const emptyRows =
    rowsPerPage -
    Math.min(rowsPerPage, data ? data.length - page * rowsPerPage : 0)

  console.log('reload')
  return (
    <Paper className={className || classes.root}>
      {!data ? (
        <CircularProgress className={classes.progress} />
      ) : (
        <React.Fragment>
          <EnhancedTableToolbar
            tableTitle={tableTitle}
            numSelected={selected.length}
            getActions={getActions}
          />
          <div className={classes.tableWrapper}>
            <Table className={classes.table} aria-labelledby="tableTitle">
              {customHead || (
                <EnhancedTableHead
                  columnNames={columnNames}
                  numSelected={selected.length}
                  direction={direction}
                  orderBy={orderBy}
                  onSelectAll={handleSelectAll}
                  onSortRequest={handleSortRequest}
                  rowCount={data.length}
                />
              )}
              <TableBody>
                {stableSort()
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map(row => getRow(row, isSelected(row[selectionFieldName])))}
                {emptyRows > 0 && (
                  <TableRow style={{ height: 49 * emptyRows }}>
                    <TableCell colSpan={6} />
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <TablePagination
            rowsPerPageOptions={[5, 10, 15]}
            component="div"
            count={data.length}
            rowsPerPage={rowsPerPage}
            page={page}
            backIconButtonProps={{
              'aria-label': 'Previous Page'
            }}
            nextIconButtonProps={{
              'aria-label': 'Next Page'
            }}
            onChangePage={handleChangePage}
            onChangeRowsPerPage={handleChangeRowsPerPage}
          />
        </React.Fragment>
      )}
    </Paper>
  )
}

export default withStyles(styles)(Component)
