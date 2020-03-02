export const C = {
    ADD_SENSOR_DATA: 'ADD_SENSOR_DATA',
    RELOAD_SENSOR_DATA: 'RELOAD_SENSOR_DATA',
    UPDATE_POWERLINK_DATA: 'UPDATE_POWERLINK_DATA',
    LOAD_SENSOR_CONFIG: 'LOAD_SENSOR_CONFIG'
}

export const initAppState = {
    startTime: 0,
    endTime: 0,
}

export const initSensor = {
    id: null,
    loc: 'Unknown',
    type: 'Unknown',
    status:  'Unknown',
    isalarm:  'Unknown',
    data: [],
}

export const powerlinkInit = {
    serial: null,
    account: null,
    configuration_status: null,
    id: null,
    upgrade_status: null,
    ver_hw: null,
    ver_sw: null,
    ver_var: null,
    ping: [],
}