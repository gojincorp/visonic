import deepFreeze from 'deep-freeze'
import sensors from '../reducers/sensors'
import {
    action,
} from '../utils/dispatchers'

describe('REDUCERS', () => {
    test('LOAD_SENSOR_CONFIG', () => {
        const state = []
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

        deepFreeze(state)
        deepFreeze(data)
        const result = sensors(state, action.loadSensorConfig({ data }))
        expect(result)
            .toEqual(data)
    })
    test('LOAD_SENSOR_DATA', () => {
        const state = [{
        }, {
            id: 1,
            loc: 'Upstairs',
            type: 'Interior',
        }, {
            id: 2,
            loc: 'Back Door',
            type: 'Perimeter',
        }]
        const data = [[{
            x: 1583282768000,
            y: 1,
            data: '',
        }, {
            x: 1583282777000,
            y: 1,
            data: '',
        }, {
            x: 1583369177000,
            y: 1,
            data: '',
        }], [{
            x: 1583282777000,
            y: -1,
            data: 'Unknown',
        }, {
            x: 1583288894000,
            y: 0,
            data: 'OK',
        }, {
            x: 1583369177000,
            y: 0,
            data: 'OK',
        }], [{
            x: 1583282777000,
            y: -1,
            data: 'Unknown',
        }, {
            x: 1583288894000,
            y: 0,
            data: 'OK',
        }, {
            x: 1583369177000,
            y: 0,
            data: 'OK',
        }]]

        deepFreeze(state)
        deepFreeze(data)
        const result = sensors(state, action.loadSensorData({ data }))
        expect(result)
            .toEqual([{
                data: [{
                    x: 1583282768000,
                    y: 1,
                    data: '',
                }, {
                    x: 1583282777000,
                    y: 1,
                    data: '',
                }, {
                    x: 1583369177000,
                    y: 1,
                    data: '',
                }],
            }, {
                id: 1,
                loc: 'Upstairs',
                type: 'Interior',
                data: [{
                    x: 1583282777000,
                    y: -1,
                    data: 'Unknown',
                }, {
                    x: 1583288894000,
                    y: 0,
                    data: 'OK',
                }, {
                    x: 1583369177000,
                    y: 0,
                    data: 'OK',
                }],
            }, {
                id: 2,
                loc: 'Back Door',
                type: 'Perimeter',
                data: [{
                    x: 1583282777000,
                    y: -1,
                    data: 'Unknown',
                }, {
                    x: 1583288894000,
                    y: 0,
                    data: 'OK',
                }, {
                    x: 1583369177000,
                    y: 0,
                    data: 'OK',
                }],
            }])
    })
})
