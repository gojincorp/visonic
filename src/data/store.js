import { createStore, combineReducers } from 'redux'
import { appState } from '../reducers/appState'
import { sensors } from '../reducers/sensors'
import { powerlink } from '../reducers/powerlink'

const store = createStore(combineReducers({ appState, sensors, powerlink }))

export default store