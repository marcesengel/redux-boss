const checkType = require('./checkType')
const Immutable = require('immutable')

const reducers = {}

function add (actionType, reducer, handler) {
  if (!reducers[actionType])
    reducers[actionType] = {}

  if (typeof reducers[actionType][reducer] === 'function')
    throw new Error('Duplicate \'' + reducer + '\' reducer handler for event \'' + event + '\' on \'' + this.actionType + '\'.')

  reducers[actionType][reducer] = handler
}

function createReducer (createDefaultState) {
  if (typeof createDefaultState === 'undefined')
    createDefaultState = function () {
      return Immutable.Map()
    }
  
  checkType(createDefaultState, 'function', createDefaultState)

  return function reducer (state, action) {
    if (action.type === '@@INIT')
      return createDefaultState()

    const handlers = reducers[action.type]
    if (!handlers)
      return state

    return Object.keys(handlers).reduce(
      function (state, reducerKey) {
        return state.set(
          reducerKey,
          handlers[reducerKey].call(
            null,
            state.get(reducerKey, Immutable.Map()),
            action.payload
          )
        )
      },
      state
    )
  }
}

module.exports.add = add
module.exports.createReducer = createReducer
