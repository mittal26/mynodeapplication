const express = require('express');
const router = express.Router();

const request = require('request');
const got     = require('got');

router.get('/', (req, res) => {
    res.render('search');
});

router.get('/results', (req, res) => {
    (async () => {
        try {
            let query = req.query.search;

            const response = await got('https://api.themoviedb.org/3/search/movie?api_key=d81b777414e6eb73aacf4b1e125989d0&query=' + query, { responseType: 'json', resolveBodyOnly: true });

            // console.log(Object.keys(response.results).length,"dfsdfds");
            if (Object.keys(response.results).length !== 0) {
                let data = (response);
                res.render('movies', { data: data, searchQuery: query });
            } else {
                let data = "No Movie Found";
                res.render('movies', { data: data, searchQuery: query });
            }
        } catch (error) {
            console.log(error);
            //=> 'Internal server error ...'
        }
    })();

});

module.exports = router;