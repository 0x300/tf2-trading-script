(function(){
	$(document).ready(function(){
		// sort listings by most recent update
		var listings = $('.media.listing');
		listings.sort(function(x,y){

		    var xtime = $(x).find('.timeago').attr('title');
		    var ytime = $(y).find('.timeago').attr('title');
		    
		    if(xtime != undefined && ytime != undefined)
		    {	
		        xtime = new Date(xtime);
		        ytime = new Date(ytime);
		        return ytime - xtime;
		    }
		    else
		    {
		        console.log("undefined time..");
		    }
		});
		$('.media-list').html(listings);
	});
})();