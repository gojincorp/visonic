import { C } from '../constants/constants'

/**
 * ACTION CREATORS
 **************************************************************************** */
const action = {
    updatePowerlinkData(newState) {
        // console.log('DISPATCH (UPDATE_POWERLINK_DATA):  ', newState)
        return {
            type: C.UPDATE_POWERLINK_DATA,
            ...newState,
        }
    },
    loadSensorConfig(newState) {
        // console.log('DISPATCH (LOAD_SENSOR_CONFIG):  ', newState)
        return {
            type: C.LOAD_SENSOR_CONFIG,
            ...newState,
        }
    },
    loadSensorData(newState) {
        // console.log('DISPATCH (LOAD_SENSOR_DATA):  ', newState)
        return {
            type: C.LOAD_SENSOR_DATA,
            ...newState,
        }
    },
    setRange(newState) {
        console.log('DISPATCH (SET_RANGE):', newState)
        return {
            type: C.SET_RANGE,
            range: newState,
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
        setRange(newState) {
            dispatch(action.setRange(newState))
        },
    }
)

export {
    action,
    dispatcher,
}
