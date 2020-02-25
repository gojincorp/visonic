import axios from 'axios'

/*
 * Wrapper GET class for axios module
 * @param {string} url - Full URL
 * @param {object} query - query string data
 * @return {object}
 */
async function ajaxGet(url, query = {}) {
    try {
        const res = await axios.get(url, { params: query })
        const { data } = res
        // console.log(`ajaxGet (${url}):  `, data)
        return data
    } catch (err) {
        console.log(`CATCH ERR (ajaxGet/${url}):  `, err)
        throw new Error(err.message)
    }
}
/*
 * General delay function
 * @param {number} ms - milleseconds of delay
 * @return {Promise} Promise object representing the completion of a setTimeout() call
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/*
 * Polling function with builtin retry functionality
 * @param {function} fn - async callback function
 * @param {number} [interval = 5000] - interval in milliseconds
 * @param {number} [retries = Infinity] - number of retries
 * @return {Promise} Promise object representing the completion of async callback function
 */
function poll(fn, interval = 5000, retries = Infinity) {
    console.log('_poll START')
    let countDown = retries
    return Promise.resolve()
        .then(fn)
        .catch(function retry(err) {
            console.log(`CATCH ERR (poll/retry): ${err}`)
            if (countDown-- > 0) {
                return delay(interval)
                    .then(fn)
                    .catch(retry)
            }
            throw err
        })
}

/*
 * Polling function with builtin retry functionality
 * @param {function} fn - async callback function
 * @param {number} [interval = 5000] - interval in milliseconds
 * @param {number} [retries = Infinity] - number of retries
 * @return {Promise} Promise object representing the completion of async callback function
 */
function polling(fn, interval = 5000, retries = Infinity) {
    // console.log('_poll START')
    let retryCnt = retries
    fn()
        .then(() => delay(interval))
        .then(() => polling(fn, interval, retries))
        .catch(function retry(err) {
            // console.log(`CATCH ERR (poll/retry): ${err}`, retryCnt)
            if (retryCnt-- > 0) {
                return delay(interval)
                    .then(fn)
                    .then(() => delay(interval))
                    .then(() => polling(fn, interval, retries))
                    .catch(retry)
            }
        })
}

export {
    ajaxGet,
    delay,
    poll,
    polling,
}
