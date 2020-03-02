import { C } from '../constants/constants'

export const sensors = (state = [], action) => {
    switch (action.type) {
    case C.ADD_SENSOR_DATA:
        return state
    case C.RELOAD_SENSOR_DATA:
        return state.map(
            (sensorData) => sensor(sensorDate, action)
        )
        return state
    case C.LOAD_SENSOR_CONFIG:
        return action.data
    default:
        return state
    }
}
