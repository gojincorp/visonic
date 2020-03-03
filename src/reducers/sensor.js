import { C, initSensor } from '../constants/constants'

export default (state = initSensor, action) => {
    switch (action.type) {
    case C.ADD_SENSOR_DATA:
        return state
    case C.LOAD_SENSOR_DATA:
        return {
            ...state,
            data: action.data,
        }
    case C.RELOAD_SENSOR_DATA:
        return state
    default:
        return state
    }
}
