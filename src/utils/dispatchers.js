import { C } from '../constants/constants'
import store from '../data/store'

/**
 * DISPATCHERS pre-bound with action creators
 **************************************************************************** */
const dispatch = {
    updatePowerlinkData(newState) {
        store.dispatch(action.updatePowerlinkData(newState))
    }
}

/**
 * ACTION CREATORS
 **************************************************************************** */
const action = {
    updatePowerlinkData(newState) {
        return {
            type: C.UPDATE_POWERLINK_DATA,
            ...newState
        }
    }
}