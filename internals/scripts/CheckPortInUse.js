import chalk from 'chalk'
import detectPort from 'detect-port'

// Check if port is in use
;(() => {
  const port = process.env.PORT || '1212'

  detectPort(port, (err, availablePort) => {
    if (err) {
      console.error(err)
    } else if (port !== String(availablePort)) {
      throw new Error(
        chalk.whiteBright.bgRed.bold(
          `Port "${port}" on "localhost" is already in use. Please use another port. ex: PORT=4343 yarn dev`
        )
      )
    } else {
      process.exit(0)
    }
  })
})()
