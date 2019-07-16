const casual = require('casual')
const Immutable = require('immutable')

const makeStore = (reducer) => {
  state = Immutable.Map()

  const getState = () => state

  const dispatch = jest.fn((action) => {
    if (typeof action === 'function')
      return action.call(null, dispatch, getState)

    state = reducer(state, action)
  })

  dispatch({ type: '@@INIT' })
  dispatch.mockClear()

  return {
    getState,
    dispatch
  }
}

describe('exports', () => {
  describe('Action', () => {
    let store, Action = null
    beforeEach(() => {
      Action = require('../index').default

      store = makeStore(
        require('../index').createReducer(() => Immutable.Map({ User: Immutable.Map() }))
      )
      jest.resetModules()
    })

    it('provides the parameters for the action creator and getState to the action thunk', () => {
      const actionCreator = jest.fn(() => jest.fn())
      const action = new Action('test', actionCreator)
        .seal()

      const paramCount = casual.integer(1, 10)
      const params = []
      for (let i = 0; i < paramCount; i++) {
        params.push(casual.word)
      }

      store.dispatch(action(...params))

      expect(actionCreator).toHaveBeenCalledTimes(1)
      expect(actionCreator).toHaveBeenCalledWith(...params)

      const thunk = actionCreator.mock.results[0].value
      expect(thunk).toHaveBeenCalledTimes(1)
      expect(thunk).toHaveBeenCalledWith(
        expect.any(Function),
        store.getState
      )
    })

    it('calls the standard event listeners when an event is emitted', () => {
      const eventName = casual.word
      const payload = {
        [casual.word]: casual.sentence
      }
      const stub1 = jest.fn()
      const stub2 = jest.fn()

      const action = new Action('test', () => (emit) => {
        emit(eventName, payload)
      })
        .on(eventName, stub1)
        .on(eventName, stub2)
        .seal()

      store.dispatch(action())

      expect(stub1).toHaveBeenCalledTimes(1)
      expect(stub1).toHaveBeenCalledWith(payload, store.dispatch, store.getState)

      expect(stub2).toHaveBeenCalledTimes(1)
      expect(stub2).toHaveBeenCalledWith(payload, store.dispatch, store.getState)
    })

    it('dispatches an action containing the event name and action type when emit is called', () => {
      const actionType = casual.word
      const eventName = casual.word
      const payload = {
        [casual.word]: casual.sentence
      }

      const action = new Action(actionType, () => (emit) => {
        emit(eventName, payload)
      })
        .seal()

      store.dispatch(action())

      expect(store.dispatch.mock.calls[1][0].type).toMatch(actionType)
      expect(store.dispatch.mock.calls[1][0].type).toMatch(eventName)
    })

    it('properly registers reducers to events', () => {
      const eventName = casual.word
      const unusedEventName = casual.word
      const payload = {
        [casual.word]: casual.sentence
      }
      const handler = jest.fn((state) => state)
      const unusedHandler = jest.fn()

      const action = new Action('test', () => (emit) => {
        emit(eventName, payload)
      })
        .on(eventName, 'User', handler)
        .on(unusedEventName, 'User', unusedHandler)
        .seal()

      store.dispatch(action())

      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith(
        store.getState().get('User'),
        payload
      )

      expect(unusedHandler).not.toHaveBeenCalled()
    })

    it('persists the context between listeners', () => {
      const contextVar = casual.word
      const contextVal = casual.word

      const firstEventName = casual.word
      const secondEventName = casual.word

      const firstHandler = jest.fn(function (val) {
        this[contextVar] = val
      })
      const secondHandler = jest.fn(function () {
        return this[contextVar]
      })

      const action = new Action('test', () => (emit) => {
        emit(firstEventName, contextVal)
        emit(secondEventName)
      })
        .on(firstEventName, firstHandler)
        .on(secondEventName, secondHandler)
        .seal()

      store.dispatch(action())

      expect(secondHandler.mock.results[0].value).toBe(contextVal)
    })

    it('throws when the same action type is registered twice', () => {
      const actionType = casual.word
      const action = new Action(actionType, () => null)
        .seal()

      expect(() => new Action(actionType, () => null))
        .toThrow()
    })

    it('throws when two handlers for the same reducer are registered on the same event', () => {
      const eventName = casual.word
      const reducerKey = casual.word

      const actionObj = new Action('test', () => null)
        .on(eventName, reducerKey, () => null)

      expect(() => actionObj.on(eventName, reducerKey, () => null))
        .toThrow()
    })
  })

  describe('createReducer', () => {
    it('exports createReducer from \'./createReducer.js\'', () => {
      expect(require('../index').createReducer).toBe(require('../reducer').createReducer)
    })
  })
})
