import { C } from '../constants/constants'

/**
 * ACTION CREATORS
 **************************************************************************** */
const action = {
    updatePowerlinkData(newState) {
        console.log('DISPATCH (UPDATE_POWERLINK_DATA):  ', newState)
        return {
            type: C.UPDATE_POWERLINK_DATA,
            ...newState,
        }
    },
    loadSensorConfig(newState) {
        console.log('DISPATCH (LOAD_SENSOR_CONFIG):  ', newState)
        return {
            type: C.LOAD_SENSOR_CONFIG,
            ...newState,
        }
    },
    loadSensorData(newState) {
        console.log('DISPATCH (LOAD_SENSOR_DATA):  ', newState)
        return {
            type: C.LOAD_SENSOR_DATA,
            ...newState,
        }
    },
}

/**
 * DISPATCHERS pre-bound with action creators
 **************************************************************************** */
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
