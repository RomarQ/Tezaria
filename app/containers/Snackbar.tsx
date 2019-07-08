import React from 'react'
import { Dispatch, bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { toast } from 'react-toastify'

import { LoggerActions, LoggerActionsPrototypes } from '../actions/logger'
import { LogProps, LoggerProps } from '../reducers/logger'

interface Props {
  logs: LogProps[]
  loggerActions: LoggerActionsPrototypes
}

const Container: React.FC<Props> = ({ logs, loggerActions }) => {
  const snackCounter = React.useRef(0)

  React.useEffect(() => {
    logs
      .filter(log => log.key > snackCounter.current)
      .forEach(log => {
        snackCounter.current += 1
        toast[log.type](String(log.message))
      })
  })

  return null
}

const mapLogsToProps = ({ logger }: LoggerProps) => ({ logs: logger })
const mapDispatchersToProps = (dispatch: Dispatch) => ({
  loggerActions: bindActionCreators(LoggerActions, dispatch)
})

export default connect(
  mapLogsToProps,
  mapDispatchersToProps
)(Container)
