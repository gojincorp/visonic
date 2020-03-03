import { C } from '../constants/constants'
import sensor from './sensor'

export default (state = [], action) => {
    switch (action.type) {
    case C.ADD_SENSOR_DATA:
        return state
    case C.LOAD_SENSOR_DATA:
        return state.map(
            (sensorData, i) => sensor(sensorData, { type: action.type, data: action.data[i], })
        )
    case C.RELOAD_SENSOR_DATA:
        return state.map(
            (sensorData, i) => sensor(sensorData, { type: action.type, data: action.data[i], })
        )
    case C.LOAD_SENSOR_CONFIG:
        return action.data
    default:
        return state
    }
}
