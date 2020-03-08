import Toggler from '../utils/hoc'
import storeFactory from '../data/store'

describe('Component Unit Test...', () => {
    let container = null
    const store = {
        dispatch: jest.fn(),
        subscribe: jest.fn(),
        getState: jest.fn(() =>
            ({})
        )
    }
    const MockComponent = () => <div className="mockComponent">Mock Component</div>
    let MockToggler
    
    const mountExpect = compose(expect,toJSON,mount)

    beforeAll(() => {
        MockToggler = Toggler(MockComponent)
        //store = storeFactory()
    })

    beforeEach(() => {
        container = document.createElement('div')
        document.body.appendChild(container)
    })

    afterEach(() => {
        unmountComponentAtNode(container)
        container.remove()
        container = null
    })

    test('Render toggle button', () => {
        const parentNode = mount(<Provider store={store}><MockToggler /></Provider>)
        expect(parentNode
            .find('button')
        ).toHaveLength(1)
    })

    test('Render with child', () => {
        const parentNode = mount(<Provider store={store}><MockToggler /></Provider>)
        expect(parentNode
            .find('.mockComponent')
        ).toHaveLength(1)
    })

    test('Render without child', () => {
        const parentNode = mount(<Provider store={store}><MockToggler hidden /></Provider>)
        expect(parentNode
            .find('.mockComponent')
        ).toHaveLength(0)
    })

    test('Render child with additional prop', () => {
        const parentNode = mount(<Provider store={store}><MockToggler myProp1="My prop 1"  /></Provider>)
        const props = parentNode.find(MockComponent).props()
        expect(props.myProp1).toBeDefined()
    })

    test('Test click to hide', () => {
        const parentNode = mount(<Provider store={store}><MockToggler /></Provider>)
        parentNode
            .find('button')
            .simulate('click')

        expect(parentNode
            .find('.mockComponent')
        ).toHaveLength(0)
    })

    test('Test click to show', () => {
        const parentNode = mount(<Provider store={store}><MockToggler hidden /></Provider>)
        parentNode
            .find('button')
            .simulate('click')

        expect(parentNode
            .find('.mockComponent')
        ).toHaveLength(1)
    })

    test('Snapshot test...', () => {
        const parentNode = mount(<Provider store={store}><MockToggler /></Provider>)
        const snapshot = parentNode.html()
        expect(snapshot).toMatchSnapshot()
    })

    test('Snapshot test as JSON...', () => {
        mountExpect(<Provider store={store}><MockToggler /></Provider>).toMatchSnapshot()
    })
})
