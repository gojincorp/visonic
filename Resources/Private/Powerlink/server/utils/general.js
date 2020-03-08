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
 * Internal delay function that returns a promise
 * 
 * @param {number} ms - milliseconds
 * @return {promise} Promise object after ms time has passed
 */
function _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

/*
 * Wrapper POST class for axios module
 * @param {string} url - Full URL
 * @param {string} data - query string data
 * @param {object} config - More Axios config options
 * @return {object}
 */
async function ajaxPost(url, data = null, config = {}) {
    try {
        // console.log(`IB -> PowerLink (POST ${url}):  `)
        const res = await axios.post(
            url,
            data,
            {
                ...config,
                withCredentials: true,
                ...((visonicCookie ? { headers: { Cookie: visonicCookie } } : null)),
            },
        )
        // const data = res.data
        return res
    } catch (err) {
        console.log(`IB -> PowerLink (POST ERR:${url}):  `, err.message)
        // res.status(500).json({ message: `Internal Server Error:  ${err}` })
        throw err
    }
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
    console.log('_poll START')
    let retryCnt = retries
    fn()
        .then((data) => {
            console.log('_poll delay', data)
            return delay(interval)
        })
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
            return console.log('polling Error:  ', err)
        })
}

/*
 * Looping call to setTimeout
 * @param {function} fn - async callback function
 * @param {number} [interval = 5000] - interval in milliseconds
 * @param {number} [retries = Infinity] - number of retries
 * @return {Promise} Promise object representing the completion of async callback function
 */
function setTimeoutLoop(fn, interval = 5000, retries = Infinity) {
    // console.log('_poll START')
    let retryCnt = retries
    let loopId = null

    function repeat() {
        fn()
            .then(() => {
                retryCnt = retries
                loopId = setTimeout(repeat, interval)
                console.log("setTimeoutLoop Start....", fn.name)
            })
            .catch((err) => {
                if (retryCnt-- > 0) {
                    loopId = setTimeout(repeat, interval)
                    console.log('setTimeoutLoop Error 1:  ', err)
                } else {
                    console.log('setTimeoutLoop Error 2:  ', err)
                }
            })
    }
    repeat()

    return () => {
        console.log("CANCEL LOOP:  ", fn.name)
        if (loopId)
            clearTimeout(loopId)
    }
}

export {
    ajaxGet,
    _delay,
    ajaxPost,
    poll,
    polling,
    setTimeoutLoop,
}
