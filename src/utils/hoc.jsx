/* eslint react/jsx-props-no-spreading: 0 */
import React from 'react'
import PropTypes from 'prop-types'

export default function Toggler(ComposedComponent) {
    class _Toggler extends React.Component {
        constructor(props) {
            super(props)
            const { hidden } = props
            this.state = { hidden }
            this.showHide = this.showHide.bind(this)
        }

        showHide() {
            const {
                hidden,
            } = this.state
            this.setState({ hidden: !hidden })
        }

        render() {
            const { hidden } = this.state
            return (
                <div>
                    <button type="button" onClick={this.showHide}>Toggle</button>
                    {
                        (!hidden)
                            ? <ComposedComponent {...this.props} {...this.state} />
                            : ''
                    }
                </div>
            )
        }
    }

    _Toggler.propTypes = {
        hidden: PropTypes.bool,
    }

    _Toggler.defaultProps = {
        hidden: false,
    }

    return _Toggler
}
