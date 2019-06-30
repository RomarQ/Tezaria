import React from 'react'
import { TableRowProps } from 'react-virtualized'

/**
 * Default row renderer for Table.
 */
export default function defaultRowRenderer ({
  className,
  columns,
  index,
  key,
  onRowClick,
  onRowDoubleClick,
  onRowMouseOut,
  onRowMouseOver,
  onRowRightClick,
  rowData,
  style
}: TableRowProps & { key: number }) {
  const a11yProps = { 'aria-rowindex': index + 1 }

  if (
    onRowClick ||
    onRowDoubleClick ||
    onRowMouseOut ||
    onRowMouseOver ||
    onRowRightClick
  ) {
    a11yProps['aria-label'] = 'row'
    a11yProps['tabIndex'] = 0

    if (onRowClick) {
      a11yProps['onClick'] = (event: any) =>
        onRowClick({ event, index, rowData })
    }
    if (onRowDoubleClick) {
      a11yProps['onDoubleClick'] = (event: any) =>
        onRowDoubleClick({ event, index, rowData })
    }
    if (onRowMouseOut) {
      a11yProps['onMouseOut'] = (event: any) =>
        onRowMouseOut({ event, index, rowData })
    }
    if (onRowMouseOver) {
      a11yProps['onMouseOver'] = (event: any) =>
        onRowMouseOver({ event, index, rowData })
    }
    if (onRowRightClick) {
      a11yProps['onContextMenu'] = (event: any) =>
        onRowRightClick({ event, index, rowData })
    }
  }

  return (
    <div
      {...a11yProps}
      className={className}
      key={key}
      role="row"
      style={style}
    >
      {columns}
    </div>
  )
}
