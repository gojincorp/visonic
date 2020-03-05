import { C, initSensor } from '../constants/constants'

export default (state = initSensor, action) => {
    switch (action.type) {
    case C.LOAD_SENSOR_DATA:
        return {
            ...state,
            data: action.data,
        }
    default:
        return state
    }
}
