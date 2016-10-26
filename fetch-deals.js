(function(){
    var cheerio = require('cheerio'), //cheerio allows DOM manipulation with jQuery selectors
        http = require('http'),
        fs = require('fs'),
        open = require('open'); //used to open listings page in a cross-platorm way

    // constants
    var minProfitMargin = 0.3; // minimum profit threshold to display
    var numPages = 50; // number of pages to request
    var numExpectedResponses = numPages; // number of responses, can be reduced if req errors occur
    var maxPrice = 20; // max price for single item


    function wrapListings(profitableListings){
        console.log('Wrapping listings..');
        fs.readFile('wrapper.html', function(err, file) {
            if(err)
            {
                console.log("Unable to load wrapper..");
            }
            else
            {
                // write to the wrapper
                $ = cheerio.load(file);
                $(".media-list").html(cheerio.load(profitableListings).html());
                fs.writeFile('listings.html', $.html(), function(){
                    console.log(timestamp() + "Done generating listings.html");
                    open('listings.html');
                });
            }
        });
    }

    function filterListings(mediaListings, profitableListings){
        $(mediaListings).each(function(ind, listing) {
            var item = $(listing).find('li.item');

            // check to make sure item is tradeable
            // bptf won't have a listed price if it isn't and that causes a parse error
            if(item.hasClass('notrade'))
            {
                // console.log('Untradeable item found.. returning');
                return;
            }

            var askingPrice = item.data('listing_price');
            var bptfPrice = item.eq(0).data('p_bptf');
            var bptfLow = null, bptfHigh = null;

            // ?: means don't remember this as it's own value in match, ? means 0 or 1 times
            // TODO: add support for additional currencies aside from just ref
            var priceregex = /^\d+(?:\.\d+)?/; // matches int or float prices/low end of ranges
            var refregex = /ref/;
            var isCurrencyRef = false;

            // console.log(item.attr("title"), askingPrice, bptfPrice);
            try {
                isCurrencyRef = !!(askingPrice.match(refregex) && bptfPrice.match(refregex));
                askingPrice = askingPrice.match(priceregex);
                bptfPrice = bptfPrice.match(priceregex);
            }
            catch (TypeError) {
                console.log("askingPrice: " + askingPrice, "bptfPrice: " + bptfPrice, "\n" + $(listing).html());
            }
            //console.log("Asking: " + askingPrice + "bp.tf Price: " + bptfPrice);

            if(askingPrice != null && bptfPrice != null && isCurrencyRef) 
            {
                askingPrice = Number(askingPrice[0]);
                bptfPrice = Number(bptfPrice[0]);

                // if the prize is too high, bail
                if(askingPrice > maxPrice) return;

                if(bptfPrice - askingPrice >= minProfitMargin)
                {
                    //price is better than listed price
                    profitableListings.push(listing);
                }
            }
            else
            {
                console.log("Price parsing error..");
            }
        });
    }

    // function name: fetchListings
    // args: cb function
    // invokes callback function with an array of profitable listings 
    function fetchListings() {

        var profitableListings = []; // array of listings from bptf (html strings)
        var completedRequests = 0; // count of bptf page requests that produced responses (to tell when we're done)

        // loop to request (numPages) pages of classfield listings from bptf
        // pageNumber = 1
        for(var pageNumber=1; pageNumber<=numPages; pageNumber++) {

            // using setTimeout and pageNumber * 500 to space out the requests so we don't hit the cap
            // effectively 2 requests a second (huge bottleneck that could be removed by using the API)
            setTimeout(function(page){
                var options = {
                    host: 'backpack.tf',
                    port: 80,
                    path: '/classifieds?craftable=1&item=Random%20Craft%20Hat&offers=1&page=' + page
                };

                var data = '';
                var req = http.get(options, function(res) {
                    res.on('data', function(chunk) {
                        // collect the data chunks to the variable named "html"
                        data += chunk;
                        // console.log("I'm here");
                    }).on('end', function() {
                        // the whole of webpage data has been collected. parsing time!
                        $ = cheerio.load(data); // fake jQuery

                        //get all the listings
                        var mediaListings = $('.panel-heading:contains("Sell Orders") + div .media.listing');
                        filterListings(mediaListings, profitableListings);
                        
                        completedRequests++;
                        console.log(completedRequests + ' of ' + numExpectedResponses + ' => ' + Math.floor(completedRequests/numPages*100) + '%');
                        if(completedRequests == numExpectedResponses) wrapListings(profitableListings);
                     });
                });
                req.on('error', function(error){
                    console.log('Ignoring: ' + error);
                    numExpectedResponses--;
                });
            // using JSON.stringify to create a copy of pageNumber since this won't be called until
            // after pageNumber has been incremented again!
            }, 100*pageNumber, JSON.parse(JSON.stringify(pageNumber)));
        }  
    }

    // returns current time as string [hh:mm:ss]
    function timestamp() {
        var time = new Date();
        return '[' + time.getHours() + ':' + time.getMinutes() + ':' + time.getSeconds() + '] ';
    }

    // kick things off
    fetchListings();
})();