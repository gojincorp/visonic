import React from 'react'
import { unmountComponentAtNode } from 'react-dom'
import { act } from 'react-dom/test-utils'
import { Provider } from 'react-redux'
import deepFreeze from 'deep-freeze'
import Enzyme, { shallow, render, mount } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'

Enzyme.configure({ adapter: new Adapter() })

global.React = React
global.shallow = shallow
global.render = render
global.mount = mount
global.unmountComponentAtNode = unmountComponentAtNode
global.act = act
global.Provider = Provider
global.historicalDates = deepFreeze([
    {
        year: 1879,
        event: 'Ski Manufacturing Begins',
    },
    {
        year: 1882,
        event: 'US Ski Club Founded',
    },
    {
        year: 1926,
        event: 'First US Ski Shop Opens',
    },
    {
        year: 1964,
        event: 'Plastic Buckle Boots Available',
    },
])
