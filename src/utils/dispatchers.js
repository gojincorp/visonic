import { C } from '../constants/constants'

/**
 * ACTION CREATORS
 **************************************************************************** */
const action = {
    updatePowerlinkData(newState) {
        //console.log('DISPATCH (UPDATE_POWERLINK_DATA):  ', newState)
        return {
            type: C.UPDATE_POWERLINK_DATA,
            ...newState,
        }
    },
    loadSensorConfig(newState) {
        //console.log('DISPATCH (LOAD_SENSOR_CONFIG):  ', newState)
        return {
            type: C.LOAD_SENSOR_CONFIG,
            ...newState,
        }
    },
    loadSensorData(newState) {
        //console.log('DISPATCH (LOAD_SENSOR_DATA):  ', newState)
        return {
            type: C.LOAD_SENSOR_DATA,
            ...newState,
        }
    },
}

/**
 * DISPATCHERS pre-bound with action creators
 **************************************************************************** */
const dispatcher = (dispatch) => (
    {
        updatePowerlinkData(newState) {
            dispatch(action.updatePowerlinkData(newState))
        },
        loadSensorConfig(newState) {
            dispatch(action.loadSensorConfig(newState))
        },
        loadSensorData(newState) {
            dispatch(action.loadSensorData(newState))
        },
    }
)

export {
    action,
    dispatcher,
}
