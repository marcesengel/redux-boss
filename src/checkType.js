module.exports = function checkType (receivedValue, expectedType, errorContext) {
  if (typeof receivedValue !== expectedType)
    throw new Error(
      'Expected ' +
      errorContext +
      ' to be a ' +
      expectedType +
      '. Instead received: \'' +
      receivedValue +
      '\'.'
    )
}
