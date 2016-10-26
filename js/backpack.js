var curclass = 'All',
    curslot = 'all',
    cursort = 'data-bpslot',
    curquality = null,
    currarity = null,
    curhero = 'All',
    curcraftable = -1,
    curtradable = -1,
    qs, highlightdupe = 0,
    hideuncraft = 0,
    hideuntradable = 0,
    selection_mode = false;

function getSearchParameters() {
    var prmstr = window.location.search.substr(1);
    return prmstr != null && prmstr != "" ? transformToAssocArray(prmstr) : {};
}

function transformToAssocArray(prmstr) {
    var params = {};
    var prmarr = prmstr.split("&");
    for (var i = 0; i < prmarr.length; i++) {
        var tmparr = prmarr[i].split("=");
        params[tmparr[0]] = decodeURI(tmparr[1]);
    }
    return params;
}
Number.prototype.format = function() {
    return this.toString().split(/(?=(?:\d{3})+(?:\.|$))/g).join(",");
};

function show_search_suggestions() {
    if ($('#simple-text-search').val().length > 1) {
        $.get('/pages/search_suggestion/' + $('#simple-text-search').val(), function(data) {
            if (data.length > 0) {
                var suggestions = $('#search-suggestions');
                suggestions.html("");
                for (var i = 0; i < data.length; i++) {
                    suggestions.append($('<a class="list-group-item" href="/' + search_suggestion_target + '/?item=' + encodeURIComponent(data[i]) + '">' + data[i] + '</a>'));
                }
                suggestions.show();
            } else {
                clear_search_suggestions();
            }
        });
    } else {
        clear_search_suggestions();
    }
}

function clear_search_suggestions() {
    $('#search-suggestions').html("").hide();
}

function show_search_modal_suggestions() {
    if ($('#adv-search-item-search').val().length > 1) {
        $.get('/pages/search_suggestion/' + $('#adv-search-item-search').val() + '/20', function(data) {
            if (data.length > 0) {
                var suggestions = $('#adv-search-item-search-results');
                suggestions.html("");
                for (var i = 0; i < data.length; i++) {
                    suggestions.append($('<a class="btn btn-default btn-sm">' + data[i] + '</a>'));
                }
                suggestions.show();
            } else {
                clear_search_modal_suggestions();
            }
        });
    } else {
        clear_search_modal_suggestions();
    }
}

function clear_search_modal_suggestions() {
    $('#adv-search-item-search-results').html("<h5>No items match the search criteria.</h5>");
}

function openFormattingGuide() {
    var guideWindow = window.open('/pages/bbcode', 'Formatting Guide', 'width=600,height=600');
    if (window.focus) {
        guideWindow.focus();
    }
    return false;
}

function showMarkdownModal() {
    var body = $('<div />'),
        alert = $('<div class="alert alert-info" />'),
        format = $('<select id="markdown-format" class="form-control" />'),
        formatContainer = $('<div class="col-4" />'),
        grouping = $('<select id="markdown-grouping" class="form-control" />'),
        groupingContainer = $('<div class="col-4" />'),
        pricing = $('<select id="markdown-pricing" class="form-control" />'),
        pricingContainer = $('<div class="col-4" />'),
        form = $('<div class="row" />'),
        buttons = $('<div />'),
        generateBtn = $('<a class="btn btn-primary" id="generate-markdown">Generate</a>'),
        closeBtn = $('<a class="btn btn-default" data-dismiss="modal">Close</a>"'),
        textarea = $('<textarea id="generated-markdown" class="form-control" placeholder="Generated text will appear here."/>');
    alert.html('<i class="fa fa-info-circle"></i> This tool generates text lists designed for posting on message boards. To filter for specific items, use the Filters panel or click on items in the backpack to start selective filtering.');
    format.append($('<option value="bbcode">BBCode</option>'));
    format.append($('<option value="reddit">Reddit Markdown</option>'));
    format.append($('<option value="none">Plaintext</option>'));
    formatContainer.append(format);
    grouping.append($('<option value="none">Do not group</option>'));
    grouping.append($('<option value="quality">Group by quality</option>'));
    switch (appid) {
        case 440:
            grouping.append($('<option value="class">Group by class</option>'));
            break;
        case 570:
            grouping.append($('<option value="hero">Group by hero</option>'));
            break;
    }
    groupingContainer.append(grouping);
    pricing.append($('<option value="none">Hide prices</option>'));
    pricing.append($('<option value="range">Show prices</option>'));
    pricingContainer.append(pricing);
    form.append(formatContainer);
    form.append(pricingContainer);
    form.append(groupingContainer);
    body.append(alert);
    body.append(form);
    body.append(textarea);
    buttons.append($('<span class="text-muted"><i class="fa fa-info-circle"></i> Use Ctrl+C to quickly copy the result to the clipboard.</span>'));
    buttons.append(generateBtn);
    buttons.append(closeBtn);
    modal("Generate Markdown", body, buttons);
    $('#generate-markdown').click(function() {
        generateMarkdown();
    });
}

function generateMarkdown() {
    var text;
    var format = $('#markdown-format').val(),
        grouping = $('#markdown-grouping').val(),
        pricing = $('#markdown-pricing').val(),
        li;
    if (selection_mode) {
        li = $('.item:not(.spacer,.unselected):visible');
    } else {
        li = $('.item:not(.spacer):visible')
    }
    var out = {};
    if (grouping == 'none') {
        out['all'] = [];
    }
    li.each(function() {
        var key;
        var options = {};
        if ($(this).data('p-bptf') && pricing == 'range') {
            options.price = $(this).data('p-bptf');
        }
        if ($(this).data('paint-name')) {
            options.paint = {
                name: $(this).data('paint-name'),
                hex: $(this).attr('data-paint-hex')
            };
        }
        if ($(this).data('part-1-name') || $(this).data('part-2-name') || $(this).data('part-3-name')) {
            options.parts = [];
            for (var i = 1; i <= 3; i++) {
                if ($(this).data('part-' + i + '-name')) {
                    options.parts.push({
                        name: $(this).data('part-' + i + '-name')
                    });
                }
            }
        }
        if ($(this).data('default-name')) {
            options.name = $(this).data('default-name');
        } else if ($(this).attr('title')) {
            options.name = $(this).attr('title');
        } else {
            options.name = $(this).attr('data-original-title');
        }
        options.format = format;
        if (grouping == 'none') {
            out['all'].push(generateLine(options));
        } else {
            switch (grouping) {
                case 'quality':
                    key = $(this).data('qName');
                    break;
                case 'class':
                    key = $(this).data('class');
                    break;
                case 'hero':
                    key = $(this).data('hero');
                    break;
            }
            if (key === undefined) {
                key = 'None';
            }
            if (out[key] === undefined) {
                out[key] = [];
            }
            out[key].push(generateLine(options));
        }
    });
    if (grouping == 'none') {
        text = out['all'].join('\n');
        if (format == 'bbcode') {
            text = '[list]\n' + text + '\n[/list]';
        }
    } else {
        text = "";
        for (var key in out) {
            var groupList = out[key].join('\n');
            if (format == 'bbcode') {
                groupList = '[list]\n' + groupList + '\n[/list]';
            }
            text += generateTitle({
                format: format,
                name: key
            }) + '\n\n' + groupList + '\n\n';
        }
    }
    $('#generated-markdown').html(text).select();
}

function generateTitle(options) {
    switch (options.format) {
        case 'reddit':
            var line = '**' + options.name + '**';
            break;
        case 'bbcode':
            var line = '[b][u]' + options.name + '[/u][/b]';
            break;
        default:
            var line = '--' + options.name + '--';
            break;
    }
    return line;
}

function generateLine(options) {
    if (options.parts) {
        var partsStr = '';
        for (var i = 0; i < options.parts.length; i++) {
            partsStr += options.parts[i].name;
            if (options.parts.length == i + 1) {} else if (options.parts.length == i + 2) {
                partsStr += ' and ';
            } else {
                partsStr += ', ';
            }
        }
        if (options.parts.length > 1) {
            partsStr += ' Strange Parts';
        } else {
            partsStr += ' Strange Part';
        }
    }
    switch (options.format) {
        case 'reddit':
            var line = '* ' + options.name;
            if (options.paint) {
                line += ' painted ' + options.paint.name;
            }
            if (options.parts) {
                line += ' with ' + partsStr;
            }
            if (options.price) {
                line += ' (' + options.price + ')';
            }
            break;
        case 'bbcode':
            var line = '[*][b]' + options.name + '[/b]';
            if (options.paint) {
                line += ' painted [color=#' + options.paint.hex + ']' + options.paint.name + '[/color]';
            }
            if (options.parts) {
                line += ' with ' + partsStr;
            }
            if (options.price) {
                line += ' (' + options.price + ')';
            }
            break;
        default:
            var line = options.name;
            if (options.paint) {
                line += ' painted ' + options.paint.name;
            }
            if (options.parts) {
                line += ' with ' + partsStr;
            }
            if (options.price) {
                line += ' (' + options.price + ')';
            }
            break;
    }
    return line;
}

function selectItem(element) {
    element.removeClass('unselected');
}

function unselectItem(element) {
    element.addClass('unselected');
}

function updateAllFilters(refreshtext) {
    var found, quality, rarity, len, i;
    if (refreshtext) {
        qs.cache();
    }
    $('.item-list > li').each(function() {
        found = false;
        if (curquality !== null && curquality.length !== 0) {
            if ($(this).data('quality') !== undefined) {
                quality = $(this).data('quality');
                len = curquality.length;
                for (i = 0; i < len; i++) {
                    if (parseInt(curquality[i]) === quality) {
                        found = true;
                    }
                }
                if (!found) {
                    $(this).hide();
                }
            } else {
                $(this).hide();
            }
        }
        if (currarity !== null && currarity.length !== 0) {
            if ($(this).data('rarity') !== undefined) {
                rarity = $(this).data('rarity');
                len = currarity.length;
                for (i = 0; i < len; i++) {
                    console.log('matching ' + currarity[i] + ' and ' + rarity);
                    if (parseInt(currarity[i]) === rarity) {
                        found = true;
                    }
                }
                if (!found) {
                    $(this).hide();
                }
            } else {
                $(this).hide();
            }
        }
        if (curclass !== 'All') {
            if ($(this).data('class')) {
                if ($(this).data('class') !== curclass) {
                    $(this).hide();
                }
            } else {
                $(this).hide();
            }
        }
        if (curhero !== 'All') {
            if ($(this).data('hero')) {
                if ($(this).data('hero') !== curhero) {
                    $(this).hide();
                }
            } else {
                $(this).hide();
            }
        }
        if (curslot !== 'all') {
            if ($(this).data('slot')) {
                if ($(this).data('slot') !== curslot) {
                    $(this).hide();
                }
            } else {
                $(this).hide();
            }
        }
        if (curtradable !== -1) {
            if ($(this).data('tradable') !== undefined) {
                if ($(this).data('tradable') !== curtradable) {
                    $(this).hide();
                }
            } else {
                $(this).hide();
            }
        }
        if (curcraftable !== -1) {
            if ($(this).data('craftable') !== undefined) {
                if ($(this).data('craftable') !== curcraftable) {
                    $(this).hide();
                }
            } else {
                $(this).hide();
            }
        }
    });
    if (hideuncraft !== 0) {
        $('.item-list > li').not('.craft').hide();
    }
    if (hideuntradable !== 0) {
        $('.item-list > li').not('.trade').hide();
    }
    updateDupes();
    updateSort();
    updateMargins();
    calculateValue();
    updateClearSelectionState();
}

function showSellScreen() {
    $('#sellScreen').modal('show');
}

function updateQuality(val) {
    curquality = val;
    updateAllFilters(true);
}

function updateRarity(val) {
    currarity = val;
    updateAllFilters(true);
}

function updateSlot(val) {
    curslot = val;
    updateAllFilters(true);
}

function updateHero(val) {
    curhero = val;
    updateAllFilters(true);
}

function updateClass(val) {
    curclass = val;
    updateAllFilters(true);
}

function updateCraftable(val) {
    curcraftable = parseInt(val);
    updateAllFilters(true);
}

function updateTradable(val) {
    curtradable = parseInt(val);
    updateAllFilters(true);
}

function clearSelection() {
    if (selection_mode) {
        selectItem($('.item'));
        selection_mode = false;
    }
    updateAllFilters(true);
}

function updateDupes() {
    var li = $('.item-list li');
    if (highlightdupe) {
        $('#hideuniques').text('Ignore Duplicates');
        $('.item-list li.dupe').css('opacity', '0.50');
    } else {
        li.css('opacity', '1.0');
        $('#hideuniques').text('Highlight Duplicates');
    }
}

function updateMargins() {
    var curitem = 0,
        pagenum = 0;
    if ($("#newlist").find("li").size() > 0) {
        $('#newlist').find('.pagenum').remove();
        $('#newlist').prepend('<li class="pagenum"><span class="label label-success" id="page' + pagenum + '"><a href="#page' + pagenum + '">New Items</a></span></li>');
    } else {
        $('#newlist').remove();
    }
    pagenum = 1;
    $('#reallist .pagenum').remove();
    $('#reallist li:visible').each(function() {
        curitem = curitem + 1;
        if (curitem == 1) {
            $(this).before('<li class="pagenum"><span class="label label-default" id="page' + pagenum + '"><a href="#page' + pagenum + '">Page ' + pagenum + '</a></span></li>');
        } else {
            if (curitem == pageLen) {
                pagenum = pagenum + 1;
                curitem = 0;
            }
        }
    });
}

function updateSort() {
    $('.pagenum').remove();
    var li = $('.item-list > li:visible');
    if (cursort == 'price') {
        li.tsort({
            order: 'desc',
            data: 'price'
        }, {
            data: 'crate'
        }, {
            data: 'defindex'
        });
    } else if (cursort == 'defindex') {
        li.tsort({
            data: 'crate'
        }, {
            order: 'asc',
            data: 'defindex'
        });
    } else if (cursort == 'equipped') {
        li.tsort({
            order: 'desc',
            data: 'equipped'
        }, {
            data: 'crate'
        }, {
            data: 'defindex'
        });
    } else if (cursort == 'id') {
        li.tsort({
            order: 'desc',
            data: 'id'
        }, {
            data: 'defindex'
        });
    } else if (cursort == 'rarity') {
        li.tsort({
            order: 'desc',
            data: 'rarity'
        }, {
            data: 'crate'
        }, {
            data: 'defindex'
        });
    } else if (cursort == 'quality') {
        li.tsort({
            order: 'desc',
            data: 'quality'
        }, {
            data: 'crate'
        }, {
            data: 'defindex'
        });
    } else if (cursort == 'bpslot') {
        li.tsort({
            order: 'asc',
            data: 'bpslot'
        });
    } else if (cursort == 'market') {
        li.tsort({
            order: 'desc',
            data: 'market-p'
        });
    }
}

function updateClearSelectionState() {
    if (selection_mode) {
        $('#clear-selection').removeClass('disabled');
    } else {
        $('#clear-selection').addClass('disabled');
    }
}

function calculateValue() {
    var li, curvalue = 0,
        marketvalue = 0,
        totalitems = 0;
    if (selection_mode) {
        li = $('.item:not(.spacer,.unselected):visible');
    } else {
        li = $('.item:not(.spacer):visible')
    }
    li.each(function() {
        if ($(this).data('id') && $(this).data('id') !== -1) {
            totalitems++;
            curvalue = curvalue + parseFloat($(this).data('price'));
            if ($(this).data('market-p') && $(this).data('market-p') != -1) {
                marketvalue += $(this).data('market-p');
            }
        }
    });
    $('#refinedvalue').html(Math.round(curvalue).format());
    $('#dollarvalue').html(Math.round(curvalue * rawValue).format());
    $('#marketvalue').html(Math.round(marketvalue / 100).format());
    $('#totalitems').html(totalitems.format());
}

function searchOutpost(defindex, quality, priceindex, uncraftable) {
    var opJson = {};
    opJson.attributes = {};
    opJson.attributes.has1 = {};
    if (priceindex && quality !== 6) {
        opJson.attributes.has1[134] = priceindex;
    } else if (priceindex && quality == 6) {
        opJson.attributes.has1[187] = priceindex;
    }
    if (defindex == -1)
        defindex = 90003;
    opJson.attributes.has1.uncraftable = (uncraftable ? '1' : '0');
    opJson.has1 = gameid + ',' + defindex + ',' + quality;
    $('#outpost #op_json').val(JSON.stringify(opJson));
    $('#outpost #op_submit').click();
}

function searchBazaar(defindex, quality, priceindex, uncraftable, appid) {
    var parameters = ['quality=' + quality],
        sp, fragments;
    if (priceindex) {
        if (quality == 6) {
            parameters.push('crate=' + priceindex);
        } else {
            parameters.push('effect=' + priceindex);
        }
    }
    if (uncraftable) {
        parameters.push('flag_cannot_craft=1');
    }
    sp = 'sp=' + parameters.join(',');
    fragments = ['s=' + defindex, 'sg=' + appid, sp];
    window.open('http://bazaar.tf/search/?' + fragments.join('&'));
}

function searchLounge(defindex, quality) {
    window.open('http://dota2lounge.com/result?rdef_index[]=' + defindex + '&rquality[]=' + quality);
}
var old_query;
var search_timer;
var ajax_search;
var cached_searches = {};
var cached_timer = {};

function showSearchExamples() {
    var list = $('<ul />');
    list.append('<li class="header">Start typing...</li>').append('<li class="example"><a>bradpitt77</a></li>').append('<li class="example"><a>team captain</a></li>').append('<li class="example"><a>convert 5 keys</a></li>').append('<li class="example"><a>convert 2.49 scm</a></li>').append('<li class="example"><a>crate #30</a></li>');
    $('#navbar-search-results').html(list.html());
}

function processSearchResults(json) {
    var searchbox = $('#navbar-search-results'),
        results = $('<ul />');
    if ($.isArray(json.prices) && json.prices.length > 0) {
        results.append("<li class='header'>Prices</li>");
        $.each(json.prices, function(key, elem) {
            var element = $('<li class="mini-price" />'),
                price_links = $('<div class="buttons" />');
            element.append("<div class='item-mini'><img src='" + elem.image_url + "'></div>");
            var name = elem.item_name;
            if ($.isArray(elem.values) && elem.values.length > 0) {
                $.each(elem.values, function(doci, doc) {
                    if (doc.name_addon) {
                        name += doc.name_addon;
                    }
                    var url = '/stats/' + rawurlencode(doc.quality) + '/' + rawurlencode(elem.item_name) + '/' + (doc.tradable ? "Tradable" : "Non-Tradable") + '/' + (doc.craftable ? "Craftable" : "Non-Craftable");
                    if (doc.priceindex) {
                        url += '/' + doc.priceindex;
                    }
                    price_links.append('<a href="' + url + '" class="btn btn-xs ' + (doc.craftable ? "" : "nocraft") + ' ' + (doc.tradable ? "" : "notrade ") + '" style="border-color:' + doc.color + ';background-color:' + doc.color_dark + '">' + doc.price + '</a>');
                });
            }
            element.append("<div class='item-name'>" + name + "</div>");
            if (elem.sale_price) {
                element.append('<a href="http://store.teamfortress.com/itemdetails/' + elem.classid + '" target="_blank"><span class="label label-success">-' + Math.round(elem.sale_price / elem.orig_price * 100) + '%</span></a>');
            }
            element.append(price_links);
            results.append(element);
        });
    }
    if ($.isArray(json.suggestions) && json.suggestions.length > 0) {
        results.append('<li class="header">Active Suggestions</li>');
        $.each(json.suggestions, function(key, elem) {
            var element = $('<li class="mini-suggestion" />'),
                item = $('<div class="item-mini" style="border-color:' + elem.color + ';background-color:' + elem.color_dark + '" />'),
                buttons = $('<div class="buttons" />');
            if (elem.quality == 5 && elem.priceindex && elem.priceindex > 0) {
                item.append("<img src='/webroot/images/" + gameid + "/particles/" + elem.priceindex + "_94x94.png' />");
            }
            item.append("<img src='" + elem.image_url + "'>");
            buttons.append('<a class="btn btn-default btn-xs" href="/vote/id/' + elem._id + '">' + elem.price + '</a>').append('<a class="btn btn-default disabled btn-xs">' + elem.votes + ' votes</a>').append('<a class="btn btn-default disabled btn-xs">' + elem.comments + ' comments</a>');
            element.append(item).append('<div class="item-name">' + elem.item_name + '</div>').append(buttons);
            results.append(element);
        });
    }
    if ($.isArray(json.users) && json.users.length > 0) {
        results.append('<li class="header">Users</li>');
        $.each(json.users, function(key, elem) {
            var element = $('<li class="mini-user" />');
            var anchor = $("<a href='/profiles/" + elem._id + "' />");
            anchor.append("<img src='" + elem.avatar + "' class='avatar' />").append(elem.name);
            element.append(anchor);
            results.append(element);
        });
    }
    if (json.convert) {
        results.append('<li class="header">Currency Conversion</li>').append("<li class='conversion'>" + json.convert + "</li>");
    }
    if (results.html() == '') {
        results.append('<li class="header">No results found.</li>');
    }
    searchbox.html(results.html());
}

function rawurlencode(str) {
    str = str.toString();
    return encodeURIComponent(str).replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/\*/g, '%2A');
}

function processSearch(query) {
    if (ajax_search !== undefined) {
        ajax_search.abort();
    }
    var searchbox = $('#searchResults');
    searchbox.show();
    if ($('#navbar-search').val() == '') {
        showSearchExamples();
        return;
    }
    if (query) {
        if (cached_searches[query] == undefined) {
            searchbox.html('<li class="header"><i class="fa fa-spinner fa-spin"></i> Searching...</li>');
            ajax_search = $.ajax({
                type: "POST",
                url: '/pages/search/?text=' + rawurlencode(query),
                dataType: "json",
                success: function(json) {
                    var result = json.result;
                    cached_searches[query] = result;
                    setTimeout(function() {
                        cached_searches[query] = undefined;
                    }, 300000);
                    processSearchResults(result);
                }
            });
        } else {
            processSearchResults(cached_searches[query]);
        }
    } else {
        searchbox.html('<li class="header">Start typing...</li>');
    }
}

function toggleGiftCode() {
    $('#giftCode').toggle();
}

function get_popover_placement(pop, dom_el) {
    var width = window.innerWidth,
        left_pos;
    if (width < 500) {
        return 'top';
    }
    left_pos = $(dom_el).offset().left;
    if (left_pos < 650) {
        return 'right';
    }
    return 'left';
}

function get_tooltip_placement(pop, dom_el) {
    return $(dom_el).data('tip');
}

function Classified() {
    this.discardReport = function(cid, rid, warn) {
        $('#report-' + rid).remove();
        $.post('/classifieds/report_remove', {
            listing: cid,
            report: rid,
            warn: (warn ? 1 : 0)
        });
    };
    this.showReportModal = function(cid) {
        var select, selectGroup, commentGroup, form, buttons;
        select = $('<select class="form-control" id="report-category" />');
        select.append($('<option value="-1">(Select a reason)</option>'));
        select.append($('<option value="0">The seller is refusing to sell this item at the offered price</option>'));
        select.append($('<option value="1">The comment on the listing is offensive</option>'));
        select.append($('<option value="2">The reason is not listed</option>'));
        selectGroup = $('<div class="form-group" />');
        selectGroup.append(select);
        commentGroup = $('<div class="form-group" />');
        commentGroup.append($('<textarea id="report-comment" class="form-control" placeholder="(Optional) Enter any additional comments here."/>'));
        form = $('<div />');
        form.append($('<p>Tell us why you are submitting a report for this listing:</p>'));
        form.append(selectGroup);
        form.append(commentGroup);
        form.append($('<p id="report-error-text" class="text-muted"><i class="fa fa-info-circle"></i> Abuse of the report system may result in account suspension.</p>'));
        buttons = $('<div />');
        buttons.append($('<a class="btn btn-primary" id="submit-report">Submit Report</a>'));
        buttons.append($('<a class="btn btn-default" data-dismiss="modal">Cancel</a>'));
        modal('Report this listing', form, buttons);
        $('#submit-report').click(function() {
            classified.sendReport(cid);
        });
    };
    this.sendReport = function(cid) {
        var category = $('#report-category').val(),
            comment = $('#report-comment').val(),
            categoryGroup = $('#report-category').parent(),
            commentGroup = $('#report-comment').parent();
        categoryGroup.removeClass('has-error');
        commentGroup.removeClass('has-error');
        $('#report-error-text').html('');
        if (category == -1) {
            $('#report-error-text').html('<i class="fa fa-warning"></i> You need to select a reason.');
            categoryGroup.addClass('has-error').focus();
            return;
        }
        $('#submit-report').attr('disabled', 'disabled').html('<i class="fa fa-spinner fa-spin"></i> Sending...');
        $.post('/classifieds/report', {
            id: cid,
            category: category,
            comment: comment
        }, function(data) {
            var text;
            if (data.success) {
                text = '<p>Your report was sent successfully.</p>';
            } else {
                text = '<p>Your report was not sent. ' + data.error + '</p>';
            }
            $('#active-modal').find('.modal-body').html(text);
            $('#active-modal').find('.modal-footer').html($('<a class="btn btn-default" data-dismiss="modal">Dismiss</a>'));
        });
    };
}
var classified = new Classified();
$(function() {
    var searchResults;
    if ($(window).width() < 1250) {
        $('#media-side').hide();
        $('#media-side2').hide();
    }
    $(window).resize(function() {
        if ($(window).width() < 1250) {
            $('#media-side').fadeOut();
            $('#media-side2').fadeOut();
        } else if ($('#media-side').is(':hidden')) {
            $('#media-side').fadeIn();
            $('#media-side2').fadeIn();
        }
    });
    $("textarea[maxlength]").each(function() {
        var $textarea = $(this),
            maxlength = $textarea.attr("maxlength");
        $textarea.after($("<div>").addClass("charsRemaining"));
        $textarea.on("keyup blur", function(event) {
            if ($textarea.val().length >= maxlength) {
                var val = $textarea.val().replace(/\r\n|\r|\n/g, "\r\n").slice(0, maxlength);
                $textarea.val(val);
            }
            $textarea.next(".charsRemaining").html(maxlength - $textarea.val().length + " characters remaining");
        }).trigger("blur");
    });
    $("span.timeago").timeago();
    $('[data-tip]').tooltip({
        placement: get_tooltip_placement,
        animation: false
    });
    $('[rel=popover]').popover({
        html: true,
        trigger: 'hover',
        placement: get_popover_placement
    });
    $('.user-badge').popover({
        html: true,
        trigger: 'hover',
        placement: 'bottom'
    });
    $('.dropdown-toggle').dropdown();
    $('#navbar-search').keyup(function() {
        var query = $(this).val();
        if (old_query !== query) {
            clearTimeout(search_timer);
            search_timer = setTimeout(function() {
                processSearch(query);
            }, 350);
            old_query = query;
        }
    }).focus(function() {
        searchResults.show();
        if ($(this).val() == '') {
            showSearchExamples();
        }
    });
    $('#navbar-search-results').on('click', '.example', function() {
        var query = $(this).children('a').text();
        $('#navbar-search').val(query);
        processSearch(query);
    });
    searchResults = $('#navbar-search-results');
    $('body').click(function(evt) {
        if ($(evt.target).parents('#navbar-search-container').length == 0) {
            searchResults.hide();
        }
    });
    $('.item-list, .item-singular').on('click', '.input-items-toggle', function() {
        if ($(this).attr('data-show')) {
            $(this).children('i').removeClass('fa-minus-square-o').addClass('fa-plus-square-o');
            $(this).siblings('.input-item').css('display', 'none');
            $(this).removeAttr('data-show');
        } else {
            $(this).children('i').removeClass('fa-plus-square-o').addClass('fa-minus-square-o');
            $(this).siblings('.input-item').css('display', 'block');
            $(this).attr('data-show', 'true');
        }
    }).on('mouseleave', '.popover', function() {
        var _this = this;
        setTimeout(function() {
            if (!$(_this).is(':hover')) {
                $(_this).remove();
            }
        }, 300);
    });
    $('.item:not(.spacer)').mouseenter(function() {
        if ($(this).parent().hasClass('item-list-links')) {
            return;
        }
        $(this).popover({
            animation: false,
            html: true,
            trigger: 'manual',
            placement: get_popover_placement,
            content: createDetails($(this))
        });
        var _this = this;
        setTimeout(function() {
            if ($(_this).is(':hover')) {
                $('.popover').remove();
                if (!selection_mode) {
                    $(_this).popover('show');
                    $('#search-bazaar').click(function() {
                        var item = $(_this);
                        searchBazaar(item.data('defindex'), item.data('quality'), item.data('priceindex'), item.data('craftable') == 1 ? 0 : 1, item.data('app'));
                    });
                    $('#search-outpost').click(function() {
                        var item = $(_this);
                        searchOutpost(item.data('defindex'), item.data('quality'), item.data('priceindex'), item.data('craftable') == 1 ? 0 : 1, item.data('app'));
                    });
                    $('#search-lounge').click(function() {
                        var item = $(_this);
                        searchLounge(item.data('defindex'), item.data('quality'));
                    });
                }
            }
        }, 300);
    }).mouseleave(function() {
        if ($(this).parent().hasClass('item-list-links')) {
            return;
        }
        var _this = this;
        setTimeout(function() {
            if (!$(_this).is(':hover')) {
                if (!$('.popover').is(':hover')) {
                    $(_this).popover('hide');
                }
            }
        }, 100);
    });
    $('.user-handle-container').on('mouseleave', '.popover', function() {
        var _this = this;
        setTimeout(function() {
            if (!$(_this).is(':hover')) {
                $(_this).remove();
            }
        }, 300);
    });
    $('.item').on('shown.bs.popover', function() {
        $('.popover-timeago').timeago();
    });
    $('.handle').mouseenter(function() {
        $(this).popover({
            animation: false,
            html: true,
            trigger: 'manual',
            placement: get_popover_placement,
            content: generateMiniProfile($(this))
        });
        var _this = this;
        setTimeout(function() {
            if ($(_this).is(':hover')) {
                $('.popover').remove();
                $(_this).popover('show');
            }
        }, 300);
    }).mouseleave(function() {
        var _this = this;
        setTimeout(function() {
            if (!$(_this).is(':hover')) {
                if (!$('.popover').is(':hover')) {
                    $(_this).popover('hide');
                }
            }
        }, 100);
    });
    $('#trade-offers-help-modal').click(function() {
        var body = $('<div />');
        body.append($('<p><strong><a href="http://steamcommunity.com/my/tradeoffers/privacy" target="_blank">Click here</a></strong> to access your Trade Offer privacy settings.</p>')).append($('<p>Scroll down to the section titled <strong>Third-Party Sites</strong> and copy the given URL.</p>')).append($('<img class="img-thumbnail" src="/images/trade_offer_url_help.png" />'));
        modal("Find your Trade Offer URL", body);
    });
    $("#show-ban-user-modal").click(function() {
        var select = $('<select class="form-control" id="ban-timescale" />');
        var row = $('<div class="row" />');
        var timeContainer = $('<div class="col-3" />');
        var selectContainer = $('<div class="col-9" />');
        var time = $('<input class="form-control input-mini" type="text" id="ban-time" placeholder="Time Unit" />');
        var body = $('<div />');
        var footer = $('<div />');
        select.append('<option value="60">Minutes</option>').append('<option value="3600">Hours</option>').append('<option value="86400">Days</option>').append('<option value="604800">Weeks</option>').append('<option value="2628000">Months</option>').append('<option value="31536000">Years</option>').append('<option value="-1">Indefinite</option>');
        selectContainer.append(select);
        timeContainer.append(time);
        row.append(timeContainer).append(selectContainer);
        body.append(row).append($('<textarea id="ban-reason" placeholder="Ban Reason" class="form-control"></textarea>'));
        footer.append($('<a href="#" class="btn btn-default" data-dismiss="modal">Close</a>')).append($('<a href="#" class="btn btn-primary" id="ban-user-modal-submit" data-id="' + $(this).attr('data-id') + '">Ban User</a>'));
        modal("Ban " + $(this).data('name'), body, footer);
        $("#ban-user-modal-submit").click(function() {
            banUser(this, $(this).attr('data-id'), $("#ban-time").val(), $("#ban-timescale").val(), $("#ban-reason").val());
        });
    });
    $('#show-unban-user-modal').click(function() {
        var body = $('<div />');
        var footer = $('<div />');
        body.append($('<textarea id="ban-reason" placeholder="Unban Reason" class="form-control"></textarea>'));
        footer.append($('<a href="#" class="btn btn-default" data-dismiss="modal">Close</a>')).append($('<a href="#" class="btn btn-primary" id="ban-user-modal-submit" data-id="' + $(this).attr('data-id') + '">Unban User</a>'));
        modal("Ban " + $(this).data('name'), body, footer);
        $("#ban-user-modal-submit").click(function() {
            unbanUser(this, $(this).attr('data-id'), $("#ban-reason").val());
        });
    });
    $('.debug-toggle').click(function() {
        if ($(this).hasClass('on')) {
            $('#technical').hide();
            $(this).removeClass('on');
        } else {
            $('#technical').show();
            $(this).addClass('on');
            window.scrollTo(0, $(document).height());
        }
    });
    Vote.initHandlers($('body'));
    Listing.initHandlers($('.listing'));
});

function opposeHex(hex) {
    var r = parseInt(hex[0].toString() + hex[1].toString(), 16),
        g = parseInt(hex[2].toString() + hex[3].toString(), 16),
        b = parseInt(hex[4].toString() + hex[5].toString(), 16);
    return (r + g + b > 386 ? "000000" : "FFFFFF");
}

function generateMiniProfile(element) {
    var content = $('<div class="mini-profile" />'),
        infoContainer = $('<div class="mini-profile-info" />'),
        avatarContainer = $('<div class="mini-profile-avatar" />'),
        popoverBtnsSteam = $('<div class="popover-btns" />'),
        popoverBtnsBptf = $('<div class="popover-btns" />'),
        popoverBtnsThirdParty = $('<div class="popover-btns mini-profile-third-party" />');
    avatarContainer.append($('<a target="_blank" href="http://steamcommunity.com/profiles/' + element.attr('data-id') + '"><img class="img-polaroid-light img-rounded" src="https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/' + element.data('avatar') + '" /></a>'));
    infoContainer.append($('<h5>' + sanitize(element.data('name')) + '</h5>'));
    popoverBtnsSteam.append($('<a class="btn btn-default btn-xs" href="steam://friends/add/' + element.attr('data-id') + '"><i class="fa fa-user-plus"></i> Add</a>'));
    if (element.data('offers-params')) {
        popoverBtnsSteam.append(' ').append($('<a class="btn btn-default btn-xs" target="_blank" href="http://steamcommunity.com/tradeoffer/new/' + element.data('offers-params') + '"><i class="fa fa-exchange"></i> Offer</a>'));
    }
    popoverBtnsSteam.append(' ').append($('<a class="btn btn-default btn-xs" target="_blank" href="http://steamcommunity.com/profiles/' + element.attr('data-id') + '"><i class="stm stm-steam"></i> Community</a>'));
    popoverBtnsBptf.append($('<a class="btn btn-default btn-xs" href="/u/' + element.attr('data-id') + '"><i class="stm stm-backpack-tf"></i> Profile</a>')).append(' ').append($('<a class="btn btn-default btn-xs" href="/profiles/' + element.attr('data-id') + '"><i class="fa fa-briefcase"></i> Backpack</a>'));
    popoverBtnsThirdParty.append($('<a class="btn btn-default btn-xs" target="_blank" href="http://bazaar.tf/profiles/' + element.attr('data-id') + '"><i class="stm stm-bazaar-tf"></i> Bazaar.tf</a>')).append(' ').append($('<a class="btn btn-default btn-xs" target="_blank" href="http://tf2outpost.com/user/' + element.attr('data-id') + '"><i class="stm stm-tf2outpost"></i> TF2 Outpost</a>')).append(' ').append($('<a class="btn btn-default btn-xs" target="_blank" href="http://steamrep.com/profiles/' + element.attr('data-id') + '"><i class="stm stm-steamrep"></i> SteamRep</a>'));
    infoContainer.append(popoverBtnsSteam).append(popoverBtnsBptf);
    content.append(avatarContainer).append(infoContainer).append(popoverBtnsThirdParty);
    return content;
}

function createDetails(item) {
    var defs = $('<dl class="item-popover"/>'),
        summary = item.data('summary'),
        listing_box = $('<dd class="item-popover-listing" />'),
        style = '',
        paint, socket_text, input, prices = [],
        url, links, additional, statsUrl, friendlyUrl, i;
    if (item.data('listing-steamid')) {
        var listing_defs = $('<dl class="item-popover" />'),
            offer_button_url, offer_button_text, offer_button_icon, offer_button_class, listing_name = sanitize(item.data('listing-name'));
        listing_box.append($('<dt>Classified Listing</dt>')).append($('<dd>This item is being sold by <a href="/u/' + item.attr('data-listing-steamid') + '">' + listing_name + '</a>.</dd>')).append($('<dd>Asking Price: ' + item.data('listing-price') + '</dd>'));
        if (item.data('listing-comment')) {
            listing_box.append($('<dd><em>"' + item.data('listing-comment') + '"</em></dd>'));
        }
        if (item.data('listing-buyout')) {
            offer_button_class = 'btn-success';
        } else {
            offer_button_class = 'btn-primary';
        }
        if (item.data('listing-offers-url')) {
            offer_button_text = 'Send ' + listing_name + ' an offer';
            offer_button_icon = 'fa-exchange';
            offer_button_url = item.data('listing-offers-url') + '&for_item=' + item.data('app') + '_2_' + item.data('id');
        } else {
            offer_button_text = 'Add ' + listing_name + ' to trade';
            offer_button_icon = 'fa-plus';
            offer_button_url = 'steam://friends/add/' + item.attr('data-listing-steamid');
        }
        listing_box.append($('<dd><a class="btn btn-xs ' + offer_button_class + ' btn-listing" href="' + offer_button_url + '"><i class="fa ' + offer_button_icon + '"></i> ' + offer_button_text + '</a></dd>'));
        listing_box.append(listing_defs);
        defs.append(listing_box);
    }
    friendlyUrl = '/' + item.data('q-name') + '/' + encodeURIComponent(item.data('name')) + '/' + (item.data('tradable') == 1 ? "Tradable" : "Non-Tradable") + '/' + (item.data('craftable') == 1 ? "Craftable" : "Non-Craftable");
    if (item.data('priceindex') && item.data('priceindex') !== 0) {
        friendlyUrl += '/' + item.data('priceindex');
    }
    defs.append($('<dt>Item Details</dt>'));
    if (item.data('ke-1')) {
        summary += ' - ' + item.data('ke-1');
        if (item.data('ke-2')) {
            summary += ', ' + item.data('ke-2');
        }
    }
    if (item.data('summary-color')) {
        style = ' style="color:' + item.data('summary-color') + '"';
    }
    defs.append($('<dd' + style + '>' + summary + '</dd>'));
    if (item.data('custom-name')) {
        defs.append($('<dd>Custom Name: <span class="text-muted">&quot;' + sanitize(item.data('custom-name')) + '&quot;</span></dd>'));
    }
    if (item.data('default-name')) {
        defs.append($('<dd>Original name: ' + item.data('default-name') + '</dd>'));
    }
    if (item.data('effect-name')) {
        defs.append($('<dd>Effect: ' + item.data('effect-name') + '</dd>'));
    }
    if (item.data('killstreaker')) {
        defs.append($('<dd>Killstreaker: ' + item.data('killstreaker') + '</dd>'));
    }
    if (item.data('sheen')) {
        defs.append($('<dd>Sheen: ' + item.data('sheen') + '</dd>'));
    }
    if (item.data('tradable-after')) {
        defs.append($('<dd>Tradable After: ' + item.data('tradable-after') + '</dd>')).append($('<dd class="text-muted"><i class="fa fa-info-circle"></i> Displaying the tradable price for this item.</dd>'));
    }
    if (item.data('crafter-name')) {
        if (item.data('crafter-id')) {
            defs.append($('<dd>Crafted by: <a href="/u/' + item.attr('data-crafter-id') + '">' + sanitize(item.data('crafter-name')) + '</a></dd>'));
        } else {
            defs.append($('<dd>Crafted by: ' + sanitize(item.data('crafter-name')) + '</dd>'));
        }
    }
    if (item.data('ring-from-id')) {
        defs.append($('<dd>Shared between <a href="/u/' + item.attr('data-ring-from-id') + '">' + sanitize(item.data('ring-from-name')) + '</a> and <a href="/u/' + item.attr('data-ring-to-id') + '">' + sanitize(item.data('ring-to-name')) + '</a></dd>'));
    }
    if (item.data('custom-desc')) {
        defs.append($('<dd>Custom Description: <span class="text-muted">&quot;' + sanitize(item.data('custom-desc')) + '&quot;</span></dd>'));
    }
    if (item.data('gifted-name')) {
        if (item.data('gifted-id')) {
            defs.append($('<dd>Gifted by: <a href="/u/' + item.attr('data-gifted-id') + '">' + sanitize(item.data('gifted-name')) + '</a></dd>'));
        } else {
            defs.append($('<dd>Gifted by: ' + sanitize(item.data('gifted-name')) + '</dd>'));
        }
    }
    if (item.data('style')) {
        defs.append($('<dd>Style: ' + item.data('style') + '</dd>'));
    }
    if (item.data('exterior')) {
        defs.append($('<dd>Exterior: ' + item.data('exterior') + '</dd>'));
    }
    if (item.data('summer-2014')) {
        defs.append("<dd>Rewarded for participating in the 2014 Summer Adventure.</dd>");
    }
    if (item.data('quantity')) {
        if (item.data('quantity') == -1) {
            defs.append($('<dd>Unlimited use</dd>'));
        } else {
            defs.append($('<dd>Uses left: ' + item.data('quantity') + '</dd>'));
        }
    }
    if (item.data('origin')) {
        defs.append($('<dd>Origin: ' + item.data('origin') + '</dd>'));
    }
    if (item.data('dt2i')) {
        defs.append($('<dd class="text-info">The International ' + item.data('dt2i') + '</dd>'));
    }
    if (item.data('dt2event')) {
        defs.append($('<dd class="text-info">' + item.data('dt2event') + '</dd>'));
    }
    if (item.data('dt2match')) {
        defs.append($('<dd class="text-info">Match ID: <a href="http://dotabuff.com/matches/' + item.data('dt2match') + '" target="_blank">' + item.data('dt2match') + '</a></dd>'));
    }
    if (item.data('dt2fan')) {
        defs.append($('<dd class="text-info">Level ' + item.data('dt2fan') + ' fan</dd>'));
    }
    if (item.data('wrapped')) {
        defs.append($('<dd>Wrapped in: <strong>' + item.data('wrapped') + '</strong></dd>'));
    }
    if (item.data('paint-hex')) {
        paint = 'Paint: <span class="label label-paint" style="background-color: #' + item.attr('data-paint-hex') + '; color: #' + opposeHex(item.attr('data-paint-hex')) + '">' + item.data('paint-name') + '</span>';
        if (item.data('paint-price')) {
            paint += ' ~' + item.data('paint-price');
        }
        defs.append($('<dd>' + paint + '</dd>'));
    }
    if (item.data('part-1-name') || item.data('part-2-name') || item.data('part-3-name')) {
        defs.append($('<dt>Parts Attached</dt>'));
        for (var i = 1; i <= 3; i++) {
            if (item.data('part-' + i + '-name')) {
                defs.append($('<dd><span class="text-strangepart">' + item.data('part-' + i + '-name') + '</span> (' + item.data('part-' + i + '-score') + ') ~' + item.data('part-' + i + '-price') + '</dd>'));
            }
        }
    }
    if (item.data('socket-1-name')) {
        defs.append($("<dt>Socketed Items</dt>"));
        for (i = 1; i <= 5; i++) {
            if (item.data('socket-' + i + '-name')) {
                socket_text = item.data('socket-' + i + '-name') + ' <span class="text-muted">' + item.data('socket-' + i + '-category') + '</span>';
                if (item.data('socket-' + i + '-price')) {
                    socket_text += ' ~' + item.data('socket-' + i + '-price');
                }
                defs.append($('<dd>' + socket_text + '</dd>'));
            }
        }
    }
    if (item.data('spell-1')) {
        defs.append($("<dt>Spells</dt>"));
        for (i = 1; item.data('spell-' + i); i++) {
            defs.append($('<dd>' + item.data('spell-' + i) + '</dd>'));
        }
    }
    if (item.data('input-1')) {
        defs.append($('<dt class="input-items-toggle"><i class="fa fa-plus-square-o"></i> Input Items</dt>'));
        for (i = 1; item.data('input-' + i); i++) {
            input = item.data('input-' + i);
            if (item.data('input-' + i + '-val')) {
                input += ' <span class="text-muted">(~' + item.data('input-' + i + '-val') + ' ea.)</span>';
            } else {
                input += ' <span class="text-muted">(?)</span>';
            }
            defs.append($('<dd class="input-item" style="display:none">' + input + '</dd>'));
        }
        defs.append($('<dd>Cost to craft: ~' + item.data('input-val') + '</dd>'));
    }
    if (item.find('.decal').length > 0) {
        var decal = item.find('.decal').eq(0),
            decal_frame = $('<dd />'),
            image_url = decal.css('background-image').replace(/url\("?([\w\-/:\.]*)"?\)/, '$1');
        decal_frame.append($('<img class="img-polaroid-light" />').attr('src', image_url));
        defs.append('<dt>Decal</dt>').append(decal_frame);
    }
    if (item.data('duck-xp-level') || item.data('duck-power')) {
        defs.append('<dt>Duck Journal</dt>').append("<dd>Duck XP Level: " + item.data('duck-xp-level') + "</dd>").append("<dd>Duck Power: " + item.data('duck-power') + " / 5</dd>");
    }
    if (item.data('p-bptf')) {
        var string = item.data('p-bptf');
        if (item.data('p-bptf-all')) {
            string += ' (' + item.data('p-bptf-all') + ')';
        }
        prices.push($('<dd>backpack.tf: ' + string + '</dd>'));
    }
    if (item.data('p-combined')) {
        prices.push($('<dd>Combined effects average price: ' + item.data('p-combined') + '</dd>'));
    }
    if (prices.length > 0) {
        defs.append($('<dt>Suggested Values</dt>'));
        for (i = 0; i < prices.length; i++) {
            defs.append(prices[i]);
        }
    }
    if (item.data('is-unique')) {
        defs.append('<span class="label label-warning">Warning</span> This item\'s value is possibly higher (Unique #).');
    }
    var price_links = $('<dd class="popover-btns" id="popover-price-links" />');
    if (item.data('market-p') && item.data('market-p') != -1) {
        var market_name = "";
        if (item.data('default-name')) {
            market_name = item.data('default-name');
        } else if (item.attr('title')) {
            market_name = item.attr('title');
        } else {
            market_name = item.attr('data-original-title');
        }
        market_name = market_name.replace('Non-Craftable ', '');
        market_name = market_name.replace(' #', ' Series #');
        if (item.data('market-p')) {
            price_links.append($('<a class="btn btn-default btn-xs" href="http://steamcommunity.com/market/listings/' + item.data('app') + '/' + rawurlencode(market_name) + '" target="_blank"><i class="stm stm-steam"></i> $' + (item.data('market-p') / 100).toFixed(2) + ' <span class="text-muted">x' + item.data('market-s') + '</span></a>'));
        }
    }
    if (price_cache[friendlyUrl]) {
        addThirdPartyButtons(price_links, item, price_cache[friendlyUrl]);
    } else {
        price_links.append($('<a class="btn btn-default btn-xs disabled"><i class="fa fa-spin fa-spinner"></i></a>'));
        // $.get('/item/get_third_party_prices' + friendlyUrl, function(data) {
        //     price_links.children('.disabled').remove();
        //     if (data.success == 1) {
        //         price_cache[friendlyUrl] = data.prices;
        //         addThirdPartyButtons(price_links, item, data.prices);
        //     }
        // });
    }
    var name = item.data('name');
    if (item.data('australium')) {
        name = name.substring(11);
    }
    url = 'http://backpack.tf/classifieds/?item=' + name + '&quality=' + item.data('quality') + '&tradable=' + item.data('tradable') + '&craftable=' + item.data('craftable');
    if (item.data('australium')) {
        url += '&australium=1';
    }
    if (item.data('crate')) {
        url += '&numeric=crate&comparison=eq&value=' + item.data('crate');
    }
    defs.append(price_links);
    var search_links = $('<dd class="popover-btns" />');
    if (item.data('app') != 440 || [5000, 5001, 5002].indexOf(item.data('defindex')) === -1) {
        search_links.append($('<a class="btn btn-default btn-xs" href="' + url + '" target="_new"><i class="stm stm-backpack-tf"></i> Classifieds</a>'));
    }
    if (item.data('app') == 440 || item.data('app') == 570) {
        search_links.append($('<a class="btn btn-default btn-xs" id="search-bazaar"><i class="stm stm-bazaar-tf"></i> Bazaar</a>'));
    }
    if (item.data('app') == 570) {
        search_links.append($('<a class="btn btn-default btn-xs" id="search-lounge"><i class="stm stm-dota2lounge"></i> Lounge</a>'));
    }
    if (item.data('app') == 440) {
        search_links.append($('<a class="btn btn-default btn-xs" id="search-outpost"><i class="stm stm-tf2outpost"></i> Outpost</a>'));
        if (item.data('quality') == 5 && item.data('priceindex') && item.data('priceindex') !== 0) {
            search_links.append($('<a class="btn btn-default btn-xs" href="/premium/search?cat=particle&particle=' + item.data('priceindex') + '&defindex=' + item.data('defindex') + '" target="_blank"><i class="fa fa-star"></i> Premium</a>'));
        }
    }
    defs.append(search_links);
    var additional_links = $('<dd class="popover-btns" />');
    statsUrl = 'http://backpack.tf/stats' + friendlyUrl;
    additional_links.append($('<a class="btn btn-default btn-xs" href="' + statsUrl + '" target="_blank"><i class="fa fa-list-alt"></i> Stats</a>'));
    if (item.data('can-sell')) {
        additional_links.append($('<a class="btn btn-default btn-xs" href="/classifieds/add/' + item.data('id') + '"><i class="fa fa-tag"></i> ' + (item.data('listing-steamid') ? 'Relist' : 'Sell') + '</a>'));
    }
    if (item.data('original-id')) {
        additional_links.append($('<a class="btn btn-default btn-xs" href="http://backpack.tf/item/' + item.data('original-id') + '" target="_blank"><i class="fa fa-calendar-o"></i> History</a>'));
    }
    if (item.data('vote')) {
        additional_links.append($('<a class="btn btn-default btn-xs" href="/vote/id/' + item.data('vote') + '"><i class="fa fa-check"></i> Suggestion</a>'));
    }
    if (item.data('app') == 440) {
        additional_links.append($('<a class="btn btn-default btn-xs" href="http://wiki.teamfortress.com/scripts/itemredirect.php?id=' + item.data('defindex') + '&lang=en_US" target="_blank"><i class="stm stm-tf2"></i> Wiki</a>'));
    }
    defs.append(additional_links);
    return defs;
}

function addThirdPartyButtons(row, item, price_data) {
    var url;
    if (price_data.tradetf) {
        url = 'http://trade.tf/price/' + item.data('defindex');
        if (item.data('crate')) {
            url += '_' + item.data('crate');
        }
        if (item.data('craftable') == 0) {
            url += '/-1';
        } else {
            url += '/' + item.data('quality');
        }
        row.append($('<a class="btn btn-default btn-xs" href="' + url + '" target="_blank"><i class="stm stm-trade-tf"></i> ' + price_data.tradetf.value + ' ' + (price_data.tradetf.unsure ? '<i class="fa fa-exclamation"></i>' : '') + '</a>'));
    }
    if (price_data.tf2wh) {
        row.append($('<a class="btn btn-default btn-xs" href="http://tf2wh.com/item/' + item.data('defindex') + '/' + item.data('quality') + '" target="_blank"><i class="stm stm-tf2wh"></i> ' + price_data.tf2wh.value + ' <span class="text-muted">x' + price_data.tf2wh.count + '</span></a>'));
    }
    if (price_data.mannco) {
        row.append($('<a class="btn btn-default btn-xs" href="http://store.teamfortress.com/itemdetailsbydefindex/' + item.data('defindex') + '" target="_blank"><i class="stm stm-tf2"></i> $' + price_data.mannco.value + '</a>'));
    }
}

function sanitize(input) {
    return $('<div />').html(input).text();
}
var price_cache = {};
