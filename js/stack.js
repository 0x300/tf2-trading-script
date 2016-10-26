function banUser(elem, steamid, timeunit, timescale, reason) {
    $(elem).attr('disabled', true).html('<i class="fa fa-spinner fa-spin"></i> Please wait...');
    $.ajax({
        url: "/user/ban",
        type: "POST",
        data: {
            'steamid': steamid,
            'timeunit': timeunit,
            'timescale': timescale,
            'reason': reason,
            'user-id': userID
        }
    }).done(function() {
        location.reload();
    });
}

function unbanUser(elem, steamid, reason) {
    $(elem).attr('disabled', true).html('<i class="fa fa-spinner fa-spin"></i> Please wait...');
    $.ajax({
        url: "/user/unban",
        type: "POST",
        data: {
            'steamid': steamid,
            'reason': reason,
            'user-id': userID
        }
    }).done(function() {
        location.reload();
    });
}

function modal(titleContent, bodyContent, footerContent) {
    $('#active-modal').remove();
    $('.modal-backdrop').remove();
    var active_modal = $('<div class="modal fade" id="active-modal"/>'),
        dialog = $('<div class="modal-dialog" />'),
        content = $('<div class="modal-content" />'),
        header = $('<div class="modal-header" />'),
        body = $('<div class="modal-body" />'),
        footer = $('<div class="modal-footer" />'),
        headerClose = $('<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>'),
        title = $('<h4 class="modal-title" />');
    if (footerContent === undefined) {
        footerContent = $('<a class="btn btn-default" data-dismiss="modal">Dismiss</a>');
    }
    title.append(titleContent);
    header.append(headerClose).append(title);
    body.append(bodyContent);
    footer.append(footerContent);
    content.append(header).append(body).append(footer);
    dialog.append(content);
    active_modal.append(dialog);
    $('#page-content').append(active_modal);
    $('#active-modal').modal();
}
var Reportable = {
    Classified: 0,
    Suggestion: 1,
    Comment: 2,
    User: 3,
    Trust: 4
};
var ReportCategory = {
    Scammer: 0,
    BadSuggestion: 1,
    RudeComment: 2,
    Manipulation: 3,
    Other: 4,
    RefusedPrice: 5,
    TrustFalse: 6,
    TrustNotTrading: 7,
    InvalidOffersURL: 8
};
var Trust = {
    get: function(element) {
        if (element.hasClass('trust')) {
            return element.attr('id').split('-')[1];
        }
        return this.get(element.parent());
    },
    interpret: function(element) {
        var lid = this.get(element);
        if (element.hasClass('trust-remove')) {
            this.removePrompt(lid);
        } else if (element.hasClass('trust-report')) {
            this.report(lid);
        }
    },
    removePrompt: function(lid) {
        var element = $('#trust-' + lid).find('.trust-remove');
        if (element.hasClass('trust-remove-prompt')) {
            this.remove(lid);
        } else {
            element.addClass('trust-remove-prompt').html('<i class="fa fa-times"></i> Click to confirm removal');
        }
    },
    remove: function(lid) {
        var element = $('#trust-' + lid);
        element.css('opacity', 0.5);
        $.post('/user/trust_remove/', {
            id: lid,
            'user-id': userID
        }, function(data) {
            if (data.success == 1) {
                element.find('.trust-remove').html('<i class="fa fa-sw fa-times"></i> This rating was removed by ' + data.name).addClass('disabled').removeClass('trust-remove');
            } else {
                modal("An error occured", data.error);
            }
            element.css('opacity', 1);
        });
    },
    report: function(tid) {
        Report.modal(Reportable.Trust, tid);
    },
    initHandlers: function(element) {
        element.find('.trust-buttons').on('click', 'a', function() {
            Trust.interpret($(this));
        });
    }
};
var Report = {
    modal: function(object_type, object_id) {
        var categories, title, footer = $('<div />'),
            body = $('<div />'),
            reportables, select_group = $('<div class="form-group" />'),
            category_select = $('<select class="form-control" id="report-category-select" />');
        title = "Report this " + report_meta.object_names[object_type];
        reportables = report_meta.object_reportables[object_type];
        category_select.append($('<option value="-1">Select a reason...</option>'));
        for (var i = 0; i < reportables.length; i++) {
            category_select.append($('<option value="' + reportables[i] + '">' + report_meta.type_strings[reportables[i]] + '</option>'))
        }
        select_group.append(category_select);
        body.append(select_group);
        body.append($('<textarea class="form-control" id="report-additional-text" placeholder="(Optional) Additional information to help us solve the problem here. "/>'));
        footer.append($('<button id="report-send" class="btn btn-danger">Send Report</button>'));
        footer.append($('<a class="btn btn-default" data-dismiss="modal">Close</a>'));
        modal(title, body, footer);
        var _this = this;
        $('#report-send').click(function() {
            $(this).prop('disabled', true).html('<i class="fa fa-spin fa-spinner"></i> Reporting...');
            _this.send(object_type, object_id, $('#report-category-select').val(), $('#report-additional-text').val());
        });
    },
    send: function(object_type, object_id, category, comments) {
        $.post('/report/send', {
            type: object_type,
            id: object_id,
            category: category,
            comments: comments,
            'user-id': userID
        }, function(data) {
            if (!data.success) {
                modal("An error occurred", data.error);
            } else {
                modal("Report Sent", "Thank you - your report will be looked into as soon as possible.");
            }
        });
    }
};
var Listing = {
    get: function(element) {
        if (element.hasClass('listing')) {
            return element.attr('id').split('-')[1];
        }
        return this.get(element.parent());
    },
    interpret: function(element) {
        var lid = this.get(element);
        if (element.hasClass('listing-remove')) {
            this.removePrompt(lid);
        } else if (element.hasClass('listing-report')) {
            this.report(lid);
        }
    },
    removePrompt: function(lid) {
        var element = $('#listing-' + lid).find('.listing-remove');
        if (element.hasClass('listing-remove-prompt')) {
            this.remove(lid);
        } else {
            element.addClass('listing-remove-prompt').html('<i class="fa fa-times"></i> Click to confirm removal');
        }
    },
    remove: function(lid) {
        var element = $('#listing-' + lid);
        element.css('opacity', 0.5);
        $.post('/classified/remove/' + lid, {
            'user-id': userID
        }, function(data) {
            if (data.success == 1) {
                element.animate({
                    height: "0px"
                }, 200, function() {
                    element.remove();
                });
            } else {
                modal("An error occured", data.error);
                element.css('opacity', 1);
            }
        });
    },
    report: function(lid) {
        Report.modal(Reportable.Classified, lid);
    },
    initHandlers: function(element) {
        element.find('.listing-buttons').on('click', 'a', function() {
            Listing.interpret($(this));
        });
    }
};
var Vote = {
    get: function(element) {
        if (element.hasClass('vote') || element.hasClass('vote-row')) {
            return element.attr('id').split('-')[1];
        }
        return this.get(element.parent());
    },
    interpret: function(element) {
        var vote = this.get(element);
        if (element.hasClass('vote-agree')) {
            this.agree(vote);
        } else if (element.hasClass('vote-disagree')) {
            this.disagree(vote);
        } else if (element.hasClass('vote-assign')) {
            this.assign(vote);
        } else if (element.hasClass('vote-unassign')) {
            this.unassign(vote);
        } else if (element.hasClass('vote-close')) {
            this.closeModal(vote);
        } else if (element.hasClass('vote-close-user')) {
            this.closeModalUser(vote);
        } else if (element.hasClass('vote-accept')) {
            this.acceptModal(vote);
        }
    },
    agree: function(vote) {
        var btns = $('#vote-' + vote).find('.btn-group-vote');
        btns.children('.vote-disagree').removeClass('active');
        if (btns.children('.vote-agree').hasClass('active')) {
            this.vote(vote, 0);
            btns.children('.vote-agree').removeClass('active');
        } else {
            this.vote(vote, 1);
            btns.children('.vote-agree').addClass('active');
        }
    },
    disagree: function(vote) {
        var btns = $('#vote-' + vote).find('.btn-group-vote');
        btns.children('.vote-agree').removeClass('active');
        if (btns.children('.vote-disagree').hasClass('active')) {
            this.vote(vote, 0);
            btns.children('.vote-disagree').removeClass('active');
        } else {
            this.vote(vote, -1);
            btns.children('.vote-disagree').addClass('active');
        }
    },
    vote: function(vote, mode) {
        var count = $('#vote-' + vote).find('.vote-count');
        $.get('/vote/save?id=' + vote + '&vote=' + mode + '&user-id=' + userID, function(data) {
            if (data.success == 0) {
                alert(data.alert);
            } else {
                count.text(data.votes);
            }
        });
    },
    assign: function(vote) {
        $.getJSON('/vote/assign/' + vote + '/1?user-id=' + userID, function(data) {
            if (data.success == 0) {
                alert(data.message);
            } else {
                location.reload();
            }
        });
    },
    unassign: function(vote) {
        $.getJSON('/vote/assign/' + vote + '/0?user-id=' + userID, function(data) {
            if (data.success == 0) {
                alert(data.message);
            } else {
                location.reload();
            }
        });
    },
    acceptModal: function(id) {
        var buttons = $('<div/>');
        buttons.append($('<a class="vote-accept-submit btn btn-success" data-vote="' + id + '">Accept Vote</a>'));
        buttons.append($('<a class="btn btn-default" data-dismiss="modal">Cancel</a>'));
        modal("Are you sure you want to accept this vote?", "<p><i class='fa fa-spin fa-spinner'></i> Fetching vote statistics... this may take a while for large votes.</p>", buttons);
        $.get('/vote/meta/' + id, function(data) {
            var body = $('#active-modal').find('.modal-body');
            body.html(Vote.getAlerts(data));
        });
        $('.vote-accept-submit').click(function() {
            $(this).addClass('disabled').removeClass('vote-accept-submit').html('<i class="fa fa-spin fa-spinner"></i> Accepting...');
            $.post('/vote/accept/' + $(this).attr('data-vote'), {
                'user-id': userID
            }, function(data) {
                if (data.success == 1) {
                    location.reload();
                } else {
                    modal("An error occured", data.error);
                }
            });
        });
    },
    closeModal: function(id) {
        var footer = $("<div/>"),
            buttons = $('<div/>'),
            closeCategorySelect = $('<select class="form-control" id="close-category" />');
        buttons.append($('<a class="vote-close-submit btn btn-danger" data-vote="' + id + '">Close Vote</a>'));
        buttons.append($('<a class="btn btn-default" data-dismiss="modal">Cancel</a>'));
        closeCategorySelect.append('<option value="0">Close reason (optional)</option>').append('<option value="1">No evidence</option>').append('<option value="2">Insufficient evidence</option>').append('<option value="3">Vote manipulation</option>').append('<option value="4">Price manipulation</option>').append('<option value="5">Bad price range</option>').append('<option value="6">Troll</option>');
        var closeCategoryGroup = $('<div class="form-group" />');
        closeCategoryGroup.append(closeCategorySelect);
        footer.append(closeCategoryGroup).append('<div class="form-group"><textarea id="close-text"  class="form-control" placeholder="Additional close message (optional)"/></div>').append(buttons);
        modal("Are you sure you want to close this vote?", "<p><i class='fa fa-spin fa-spinner'></i> Fetching vote statistics... this may take a while for large votes.</p>", footer);
        $.get('/vote/meta/' + id, function(data) {
            var body = $('#active-modal').find('.modal-body');
            body.html(Vote.getAlerts(data));
        });
        $('.vote-close-submit').click(function() {
            $(this).addClass('disabled').removeClass('vote-close-submit').html('<i class="fa fa-spin fa-spinner"></i> Closing...');
            $.post('/vote/close/' + $(this).attr('data-vote'), {
                category: $('#close-category').val(),
                text: $('#close-text').val(),
                'user-id': userID
            }, function(data) {
                if (data.success == 1) {
                    location.reload();
                } else {
                    modal("An error occured", data.error);
                }
            });
        });
    },
    closeModalUser: function(id) {
        var footer = $("<div/>"),
            buttons = $('<div/>');
        buttons.append($('<a class="vote-close-submit btn btn-danger" data-vote="' + id + '">Close Vote</a>')).append($('<a class="btn btn-default" data-dismiss="modal">Cancel</a>'));
        footer.append(buttons);
        modal("Are you sure you want to close this vote?", "You will not be able to reopen this vote - you will need to create a new one.", footer);
        $('.vote-close-submit').click(function() {
            $(this).addClass('disabled').removeClass('vote-close-submit').html('<i class="fa fa-spin fa-spinner"></i> Closing...');
            $.post('/vote/close/' + $(this).attr('data-vote'), {
                category: $('#close-category').val(),
                text: $('#close-text').val(),
                'user-id': userID
            }, function(data) {
                if (data.success == 1) {
                    location.reload();
                } else {
                    modal("An error occured", data.error);
                }
            });
        });
    },
    undo: function(vote) {},
    getAlerts: function(stats) {
        var favourAlert = $('<p />'),
            friendPerc = stats.friends / stats.total * 100,
            ipPerc = stats.same_ip / stats.total * 100,
            ipPercAlt = stats.same_ip_alt / stats.total * 100,
            res = $('<div class="modal-alerts" />'),
            list = $('<ul />'),
            friendAlert, ipAlert, ipAlertAlt;
        favourAlert.html(" This vote has an approval rating of <strong>" + stats.percentage.toFixed(1) + "%</strong> with a total of " + stats.total + " votes.");
        res.append(favourAlert);
        if (friendPerc != 0) {
            friendAlert = $('<li />');
            friendAlert.html(" <strong>" + stats.friends + " (" + friendPerc.toFixed(1) + "%)</strong> of the " + stats.total + " voters were friends with the vote's submitter.");
            list.append(friendAlert);
        }
        if (ipPerc != 0) {
            ipAlert = $('<li />');
            ipAlert.html(" <strong>" + stats.same_ip + " (" + ipPerc.toFixed(1) + "%)</strong> of the " + stats.total + " voters had the same IP as the vote's submitter.");
            list.append(ipAlert);
        }
        if (ipPercAlt != 0) {
            ipAlertAlt = $('<li />');
            ipAlertAlt.html(" <strong>" + stats.same_ip_alt + " (" + ipPercAlt.toFixed(1) + "%)</strong> of the " + stats.total + " voters had the same IP as another voter.");
            list.append(ipAlertAlt);
        }
        if (list.html() != "") {
            res.append($("<p>Please acknowledge the following statistics before making a decision:</p>"));
        }
        res.append(list);
        return res;
    },
    initHandlers: function(element) {
        element.find('.vote-buttons').on('click', 'a', function() {
            Vote.interpret($(this));
        });
    }
};
var Comment = {
    get: function(element) {
        if (element.hasClass('comment')) {
            return element.attr('id').split('-')[1];
        }
        return this.get(element.parent());
    },
    getVote: function() {
        return $('#comment-list').attr('data-vote');
    },
    getPoster: function(element) {
        return element.find('.meta').children('.user-handle-container').children('.handle').text();
    },
    getParent: function(element) {
        if (element.hasClass('subcomments')) {
            return element.attr('id').split('-')[1];
        }
        return this.getParent(element.parent());
    },
    interpret: function(element) {
        var comment = this.get(element);
        if (element.hasClass('comment-like')) {
            this.like(comment);
        } else if (element.hasClass('comment-dislike')) {
            this.dislike(comment);
        } else if (element.hasClass('comment-reply')) {
            this.showReplyForm(comment);
        } else if (element.hasClass('comment-warn')) {
            this.warn(comment);
        } else if (element.hasClass('comment-edit')) {
            this.showEditForm(comment);
        } else if (element.hasClass('comment-edit-cancel')) {
            this.hideEditForm(comment);
        } else if (element.hasClass('comment-edit-save')) {
            this.edit(comment);
        } else if (element.hasClass('comment-delete')) {
            this.deletePrompt(comment);
        } else if (element.hasClass('comment-show')) {
            this.show(comment);
        } else if (element.hasClass('comment-report')) {
            this.report(comment);
        }
    },
    show: function(cid) {
        $('#comment-' + cid).removeClass('fade');
        $('#comment-' + cid).children('.body').show();
        $('#comment-' + cid).find('.comment-show').remove();
    },
    getWarned: function(cid) {
        return $('#comment-' + cid).find('.comment-warn').data('value') === 1;
    },
    getLiked: function(cid) {
        return $('#comment-' + cid).find('.comment-like').data('value') === 1;
    },
    getDeletePromptState: function(cid) {
        return $('#comment-' + cid).find('.comment-delete').data('value');
    },
    setDeletePromptState: function(cid, value) {
        $('#comment-' + cid).find('.comment-delete').data('value', value);
    },
    getDisliked: function(cid) {
        return $('#comment-' + cid).find('.comment-dislike').data('value') === 1;
    },
    getReplyFormState: function(cid) {
        return $('#comment-' + cid).find('.comment-reply').data('value') === 1;
    },
    setReplyFormState: function(cid, value) {
        $('#comment-' + cid).find('.comment-reply').data('value', value);
    },
    setWarned: function(cid, value) {
        $('#comment-' + cid).addClass('fade');
        $.post('/vote/comments_warn', {
            vote: this.getVote(),
            comment: cid,
            value: value,
            'user-id': userID
        }, function(msg) {
            $('#comment-' + cid).removeClass('fade');
            if (msg.success == 1) {
                if (value == 1) {
                    $('#comment-' + cid).html($(msg.body).html()).addClass('warned fade');
                } else {
                    $('#comment-' + cid).html($(msg.body).html()).removeClass('warned fade');
                }
                Comment.initHandlers($('#comment-' + cid));
            } else {
                $('#comment-' + cid).find('.comment-warn').addClass('disabled').html(msg.error);
            }
        });
    },
    setLiked: function(cid, value) {
        var score = $('#comment-' + cid).find('.comment-score'),
            btn = $('#comment-' + cid).find('.comment-like');
        if (value == 1) {
            btn.text('Liked').data('value', 1).removeClass('btn-default').addClass('btn-success');
            score.text(parseInt(score.text()) + 1);
        } else {
            btn.text('Like').data('value', 0).removeClass('btn-success').addClass('btn-default');
            score.text(parseInt(score.text()) - 1);
        }
        $.post('/vote/comments_rate', {
            vote: this.getVote(),
            comment: cid,
            rate: 'like',
            'user-id': userID
        }, function(data) {
            if (!data.success) {
                alert(data.error);
                location.reload();
            }
        });
    },
    setDisliked: function(cid, value) {
        var score = $('#comment-' + cid).find('.comment-score'),
            btn = $('#comment-' + cid).find('.comment-dislike');
        if (value == 1) {
            btn.text('Disliked').data('value', 1).removeClass('btn-default').addClass('btn-danger');
            score.text(parseInt(score.text()) - 1);
        } else {
            btn.text('Dislike').data('value', 0).removeClass('btn-danger').addClass('btn-default');
            score.text(parseInt(score.text()) + 1);
        }
        $.post('/vote/comments_rate', {
            vote: this.getVote(),
            comment: cid,
            rate: 'flag',
            'user-id': userID
        }, function(data) {
            if (!data.success) {
                alert(data.error);
                location.reload();
            }
        });
    },
    warn: function(cid) {
        if (this.getWarned(cid)) {
            this.setWarned(cid, 0);
        } else {
            this.setWarned(cid, 1);
        }
    },
    like: function(cid) {
        if (this.getLiked(cid)) {
            this.setLiked(cid, 0);
        } else {
            this.setLiked(cid, 1);
        }
        if (this.getDisliked(cid)) {
            this.setDisliked(cid, 0);
        }
    },
    dislike: function(cid) {
        if (this.getDisliked(cid)) {
            this.setDisliked(cid, 0);
        } else {
            this.setDisliked(cid, 1);
        }
        if (this.getLiked(cid)) {
            this.setLiked(cid, 0);
        }
    },
    showReplyForm: function(replyTo) {
        if (this.getReplyFormState(replyTo)) {
            $('#subcomments-' + replyTo).children('.comment-reply-form').remove();
            this.setReplyFormState(replyTo, 0);
        } else {
            var form = $('<div class="comment-reply-form comment padded" id="reply-' + replyTo + '"/>'),
                block = $('<div class="form-group" />');
            block.append($('<label class="control-label">Reply to ' + this.getPoster($('#comment-' + replyTo)) + '</label>'));
            block.append($('<textarea class="form-control" />'));
            form.append(block);
            form.append($('<a class="comment-reply-submit btn-primary btn">Post Reply</a>'));
            form.append(" ");
            form.append($('<span class="text-muted error-text"><i class="fa fa-info-circle"></i> You have 1 hour to make changes to your comment after posting.</span>'));
            $('#subcomments-' + replyTo).prepend(form);
            $('#subcomments-' + replyTo).children('.comment-reply-form').children('textarea').focus();
            this.setReplyFormState(replyTo, 1);
            $('.comment-reply-submit').click(function() {
                Comment.reply($(this));
            });
        }
    },
    new_reply: function() {
        var element = $('#comment-new'),
            text = element.find('textarea').val(),
            textarea = element.find('textarea'),
            formGroup = element.children('.form-group'),
            errorText = element.children('.error-text'),
            button = element.children('#comment-submit');
        formGroup.removeClass('has-error');
        if (text.length < 10) {
            formGroup.addClass('has-error');
            errorText.html("<i class='fa fa-warning'></i> Your comment needs to be at least 10 characters long.");
            textarea.focus();
            button.removeClass('disabled btn-success').addClass('btn-primary').html('Post Comment');
        } else {
            formGroup.removeClass('has-error');
            button.addClass('disabled').html("<i class='fa fa-spin fa-spinner'></i> Saving...");
            $.post('/vote/comments_reply', {
                vote: this.getVote(),
                text: text,
                'user-id': userID
            }, function(msg) {
                if (msg.success == 1) {
                    textarea.val('');
                    $('#comment-list').append($(msg.body)).append($('<ul class="subcomments" id="subcomments-' + msg.id + '" />'));
                    Comment.initHandlers($('#comment-' + msg.id));
                    button.removeClass('disabled btn-primary').addClass('btn-success').html("<i class='fa fa-check'></i> Posted!");
                } else {
                    button.removeClass('disabled').html('Post Comment');
                    formGroup.addClass('has-error');
                    errorText.html("<i class='fa fa-warning'></i> " + msg.error + ".");
                    textarea.focus();
                }
            });
        }
    },
    reply: function(element) {
        var replyTo = this.getParent(element),
            reply_element = $('#reply-' + replyTo),
            text = reply_element.find('textarea').val(),
            textarea = reply_element.find('textarea'),
            formGroup = reply_element.children('.form-group'),
            errorText = reply_element.children('.error-text'),
            button = element;
        formGroup.removeClass('has-error');
        if (text.length < 10) {
            formGroup.addClass('has-error');
            errorText.html("<i class='fa fa-warning'></i> Your comment needs to be at least 10 characters long.");
            textarea.focus();
            button.removeClass('disabled').html('Post Reply');
        } else {
            formGroup.removeClass('has-error');
            button.addClass('disabled').html("<i class='fa fa-spin fa-spinner'></i> Saving...");
            $.post('/vote/comments_reply', {
                vote: this.getVote(),
                comment: replyTo,
                text: text,
                'user-id': userID
            }, function(msg) {
                if (msg.success == 1) {
                    textarea.val('');
                    Comment.showReplyForm(replyTo);
                    $('#subcomments-' + replyTo).append($(msg.body)).append($('<ul class="subcomments" id="subcomments-' + msg.id + '" />'));
                    Comment.initHandlers($('#comment-' + msg.id));
                } else {
                    button.removeClass('disabled').html('Post Reply');
                    formGroup.addClass('has-error');
                    errorText.html("<i class='fa fa-warning'></i> " + msg.error + ".");
                    textarea.focus();
                }
            });
        }
    },
    showEditForm: function(cid) {
        var element = $('#comment-' + cid);
        element.find('.comment-edit-form').show();
        element.find('.body').hide();
        element.find('.comment-edit').hide();
        element.find('.comment-edit-save').show();
        element.find('.comment-edit-cancel').show();
    },
    hideEditForm: function(cid) {
        var element = $('#comment-' + cid);
        element.find('.comment-edit-form').hide();
        element.find('.body').show();
        element.find('.comment-edit').show();
        element.find('.comment-edit-save').hide();
        element.find('.comment-edit-cancel').hide();
    },
    edit: function(cid) {
        var element = $('#comment-' + cid);
        var text = element.find('.comment-edit-form').children('textarea').val(),
            textarea = element.find('.comment-edit-form').children('textarea'),
            button = element.find('.comment-edit-save');
        if (text.length < 10) {
            modal("Errors with your edit", "Your comment must be at least 10 characters long.");
            button.removeClass('disabled').html('Save');
        } else {
            button.addClass('disabled').html("<i class='fa fa-spin fa-spinner'></i> Saving...");
            $.post('/vote/comments_edit', {
                vote: this.getVote(),
                comment: cid,
                text: text,
                'user-id': userID
            }, function(msg) {
                if (msg.success == 1) {
                    Comment.hideEditForm(cid);
                    $('#comment-' + cid).find('.body').html(msg.body);
                } else {
                    modal("Errors with your edit", msg.error + ".");
                }
                button.removeClass('disabled').html('Save');
            });
        }
    },
    deletePrompt: function(cid) {
        if (!this.getDeletePromptState(cid) || this.getDeletePromptState(cid) == 0) {
            $('#comment-' + cid).find('.comment-delete').removeClass('btn-default').addClass('btn-danger').html("Click again to confirm removal");
            this.setDeletePromptState(cid, 1);
        } else if (this.getDeletePromptState(cid) == 1) {
            this.remove(cid);
        }
    },
    remove: function(cid) {
        var element = $('#comment-' + cid);
        element.addClass('fade');
        $.post('/vote/comments_delete', {
            vote: this.getVote(),
            comment: cid,
            'user-id': userID
        }, function(msg) {
            element.removeClass('fade');
            if (msg.success == 1) {
                element.html($(msg.body).html()).addClass('comment-deleted fade');
                Comment.initHandlers(element);
            } else {
                $('#comment-' + cid).find('.comment-delete').addClass('disabled').html(msg.error);
            }
        });
    },
    report: function(cid) {
        Report.modal(Reportable.Comment, cid);
    },
    initHandlers: function(element) {
        element.find('.btn-formatting-guide').click(function() {
            openFormattingGuide();
        });
        element.find('.comment-buttons').on('click', 'a', function() {
            Comment.interpret($(this));
        });
    }
};

function initInteractivePurchase(options) {
    options.submitBtn.attr('disabled', 'disabled');
    options.tcBtn.click(function() {
        if ($(this).is(':checked')) {
            options.submitBtn.removeAttr('disabled');
        } else {
            options.submitBtn.attr('disabled', 'disabled');
        }
    });
    options.submitBtn.click(function() {
        $(this).attr('disabled', 'disabled').val(options.submitOnClickText);
        $(this).parents('form').submit();
    });
    options.totalLabel.text(options.calculation());
    options.calculationTrigger.keyup(function() {
        options.totalLabel.text(options.calculation());
    });
    options.calculationTrigger.change(function() {
        options.totalLabel.text(options.calculation());
    });
}
