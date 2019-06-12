const SerialPort = require('./stream')
const Binding = require("./bindings/index")
const parsers = require('./parsers')

/**
 * @type {AbstractBinding}
 */
SerialPort.Binding = Binding

/**
 * @type {Parsers}
 */
SerialPort.parsers = parsers

module.exports = SerialPort
