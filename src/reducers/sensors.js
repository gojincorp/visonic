import { C } from '../constants/constants'

export const sensors = (state = [], action) => {
    switch (action.type) {
    case C.ADD_SENSOR_DATA:
        return state
    case C.RELOAD_SENSOR_DATA:
        return action.data.map(
            (sensorData, i) => sensor(sensorDate, action)
        )
        return state
    default:
        return state
    }
}
