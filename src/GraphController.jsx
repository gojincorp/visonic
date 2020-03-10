import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { dispatcher } from './utils/dispatchers'

export default function GraphController ({ range, setRange }) {
    return (
       <div>
           Range:
           <select value={range} onChange={(e) => setRange(e.target.value)}>
               <option value="24">24 Hours</option>
               <option value="12">12 Hours</option>
               <option value="6">6 Hours</option>
               <option value="1">1 Hour</option>
           </select>
       </div>
    )
}

GraphController.propTypes = {
   range: PropTypes.number.isRequired,
   setRange: PropTypes.func.isRequired,
}
