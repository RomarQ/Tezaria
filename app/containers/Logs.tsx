import React from 'react'
import { Dispatch, bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import LoggerActions, { LoggerActionsPrototypes } from '../actions/logger'
import { LogProps, LoggerProps } from '../reducers/logger'

import Logs from '../components/Logs'

interface Props {
  logs: LogProps[]
  loggerActions: LoggerActionsPrototypes
}

const Container = (props: Props) => <Logs {...props} />

const mapStateToProps = ({ logger }: LoggerProps) => ({ logs: logger })
const mapDispatchersToProps = (dispatch: Dispatch) => ({
  loggerActions: bindActionCreators(LoggerActions, dispatch)
})

export default connect(
  mapStateToProps,
  mapDispatchersToProps
)(Container)
