import { C, powerlinkInit } from '../constants/constants'

export const powerlink = (state = powerlinkInit, action) => {
    switch (action.type) {
    case C.UPDATE_POWERLINK_DATA:
        return {...action.data}
    default:
        return state
    }
}
