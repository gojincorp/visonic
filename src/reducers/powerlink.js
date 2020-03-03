import { C, powerlinkInit } from '../constants/constants'

export default (state = powerlinkInit, action) => {
    switch (action.type) {
    case C.UPDATE_POWERLINK_DATA:
        return {
            ...state,
            ...action.data,
        }
    default:
        return state
    }
}
