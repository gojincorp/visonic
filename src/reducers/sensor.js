import { C, initSensor } from '../constants/constants'

export const sensor = (state = initSensor, action) => {
    switch (action.type) {
    case C.ADD_SENSOR_DATA:
        return state
    case C.RELOAD_SENSOR_DATA:
        return state
    default:
        return state
    }
}
