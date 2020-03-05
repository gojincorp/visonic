import { createStore,
    combineReducers,
    applyMiddleware} from 'redux'
import appState from '../reducers/appState'
import sensors from '../reducers/sensors'
import powerlink from '../reducers/powerlink'

const logger = store => next => action => {
    let result
    //console.groupCollapsed('Dispatching: ')
    //console.log('Action: ', action)
    result = next(action)
    //console.log('Dispatch and update complete...')
    //console.groupEnd()
    return result
}

const middlewareTest = store => next => action => {
    let result
    //console.log('Middleware test:  START')
    result = next(action)
    //console.log('Middleware test:  END')
    return result
}

const storeFactory = (initStore = {}) =>
    applyMiddleware(logger,middlewareTest)(createStore)(
            combineReducers({ appState, sensors, powerlink }),
            initStore)

export default storeFactory
