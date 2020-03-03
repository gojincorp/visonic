import { C, initAppState } from '../constants/constants'

export default (state = initAppState, action) => {
    switch (action.type) {
    case C.ADD_SENSOR_DATA:
        return state
    case C.RELOAD_SENSOR_DATA:
        return state
    default:
        return state
    }
}
