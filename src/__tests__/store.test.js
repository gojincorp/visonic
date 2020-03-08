import storeFactory from '../data/store'
import { dispatcher } from '../utils/dispatchers'

describe('Store Dispatcher', () => {
    let store
    let dispatch
    const data = [{
    }, {
        id: 1,
        loc: 'Upstairs',
        type: 'Interior',
    }, {
        id: 2,
        loc: 'Back Door',
        type: 'Perimeter',
    }, {
        id: 3,
        loc: 'Master Bedroom',
        type: 'Interior',
    }, {
        id: 4,
        loc: 'Master Bedroom',
        type: 'Perimeter',
    }, {
        id: 5,
        loc: 'Master Bedroom',
        type: 'Perimeter',
    }, {
        id: 6,
        loc: 'Master Bedroom',
        type: 'Interior',
    }, {
        id: 7,
        loc: 'Garage',
        type: 'Perimeter-Follow',
    }, {
        id: 8,
        loc: 'Garage Door',
        type: 'Perimeter-Follow',
    }, {
        id: 9,
        loc: 'Garage Door',
        type: 'Perimeter',
    }, {
        id: 11,
        loc: 'Front Door',
        type: 'Perimeter-Follow',
    }, {
        id: 12,
        loc: 'Front Door',
        type: 'Perimeter',
    }, {
        id: 13,
        loc: 'Garage Door',
        type: 'Perimeter',
    }, {
        id: 14,
        loc: 'Back Door',
        type: 'Perimeter',
    }, {
        id: 15,
        loc: 'Back Door',
        type: 'Perimeter',
    }, {
        id: 16,
        loc: 'Living Room',
        type: 'Perimeter',
    }, {
        id: 17,
        loc: 'Living Room',
        type: 'Perimeter',
    }, {
        id: 18,
        loc: 'Dining Room',
        type: 'Perimeter',
    }, {
        id: 19,
        loc: 'Kitchen',
        type: 'Perimeter',
    }, {
        id: 20,
        loc: 'Utility Room',
        type: 'Perimeter',
    }, {
        id: 21,
        loc: 'Living Room',
        type: 'Interior',
    }]

    beforeAll(() => {
        store = storeFactory()
        dispatch = dispatcher(store.dispatch)
        dispatch.loadSensorConfig({ data })
    })

    test('Dispatch:  loadSensorConfig', () => {
        expect(store.getState().sensors).toEqual(data)
    })
})
