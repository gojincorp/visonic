import { C } from '../constants/constants'
import store from '../data/store'

/**
 * DISPATCHERS pre-bound with action creators
 **************************************************************************** */
const dispatch = {
    updatePowerlinkData(newState) {
        store.dispatch(action.updatePowerlinkData(newState))
    }
}

export default (dispatcher) => (
    {
        updatePowerlinkData(newState) {
            dispatcher(action.updatePowerlinkData(newState))
        },
        loadSensorConfig(newState) {
            dispatcher(action.loadSensorConfig(newState))
        },
        loadSensorData(newState) {
            dispatcher(action.loadSensorData(newState))
        },
    }
)

/**
 * ACTION CREATORS
 **************************************************************************** */
const action = {
    updatePowerlinkData(newState) {
        console.log('DISPATCH (UPDATE_POWERLINK_DATA):  ', newState)
        return {
            type: C.UPDATE_POWERLINK_DATA,
            ...newState
        }
    },
    loadSensorConfig(newState) {
        console.log('DISPATCH (LOAD_SENSOR_CONFIG):  ', newState)
        return {
            type: C.LOAD_SENSOR_CONFIG,
            ...newState
        }
    },
    loadSensorData(newState) {
        console.log('DISPATCH (LOAD_SENSOR_DATA):  ', newState)
        return {
            type: C.LOAD_SENSOR_DATA,
            ...newState
        }
    },
}