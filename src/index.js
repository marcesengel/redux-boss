const checkType = require('./checkType')
const reducer = require('./reducer')

const actions = []

function Action (actionType, actionHandler) {
  checkType(actionType, 'string', 'action type')
  checkType(actionHandler, 'function', 'action handler')

  if (actions.includes(actionType))
    throw new Error('Duplicate action type \'' + actionType + '\'.')

  actions.push(actionType)

  this.actionType = actionType
  this.actionHandler = actionHandler
  this.sealed = false
  this.eventListeners = {}
}

Action.prototype.on = function (event) {
  checkType(event, 'string', 'event')

  if (this.sealed)
    throw new Error('Can\'t add listeners after the action has been sealed.')

  if (arguments.length > 1 && typeof arguments[1] === 'string')
    addReducer.apply(this, arguments)
  else
    addEventListener.apply(this, arguments)

  return this
}

function makeActionType (event) {
  return this.actionType + '/' + event
}

function addReducer (event, reducerKey, handler) {
  checkType(reducerKey, 'string', 'reducer')
  checkType(handler, 'function', 'handler')

  const actionType = makeActionType.call(this, event)
  reducer.add(actionType, reducerKey, handler)
}

function addEventListener (event, handler) {
  checkType(handler, 'function', 'handler')

  if (!this.eventListeners[event])
    this.eventListeners[event] = []

  this.eventListeners[event].push(handler)
}

Action.prototype.seal = function () {
  if (this.sealed)
    console.warn('Warning: Calling .seal() on already sealed action \'' + this.actionType + '\'.')

  this.sealed = true
  function createAction () {
    const thunk = this.actionHandler.apply(null, arguments)
    checkType(thunk, 'function', 'action thunk')

    function actionThunk (dispatch, getState) {
      const emit = this._createEventEmitter(dispatch, getState)

      return Promise.resolve(thunk.call(
        null,
        emit,
        getState
      ))
        .catch((error) => emit('error', error))
    }

    return actionThunk.bind(this)
  }

  return createAction.bind(this)
}

Action.prototype._createEventEmitter = function (dispatch, getState) {
  const context = {}

  function emit (event, payload) {
    if (event === 'error')
      dispatch({
        type: makeActionType.call(this, event),
        error: true,
        payload: payload
      })
    else
      dispatch({
        type: makeActionType.call(this, event),
        payload: payload
      })


    const eventListeners = this.eventListeners[event]
    if (!eventListeners)
      return

    eventListeners.forEach((listener) => listener.call(context, payload, dispatch, getState))
  }

  return emit.bind(this)
}

module.exports.default = Action
module.exports.createReducer = reducer.createReducer
