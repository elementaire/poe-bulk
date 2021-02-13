"use strict";

window.BULK && BULK.stop();

window.BULK = {
    _itemById: [],
    _jQuery: null,
    _jQueryAjax: null,
    _mutationObserver: null,
    _notification: null,
    _TEMPLATES: {
        NOTIFICATION: '<div class="toast-container toast-bottom-center"><div class="toast toast-STATE" style="display: block;"><div class="toast-title"></div> <div class="toast-message">MESSAGE</div></div></div>',
        TEXTAREA: '<div class="row"><div style="margin:0 auto;width:50%;padding:5px;"><textarea class="form-control text-center" rows="1" readonly="" style="font-family:FontinSmallcaps,serif;">WHISPER</textarea></div></div>'
    },
    start: function() {
        let me = BULK;

        if (!MutationObserver) {
            me._notify('error', 'POE Bulk: No MutationObserver.');
            return;
        }

        if (!me._jQuery) {
            let jQuery = $;

            if (!jQuery) {
                me._notify('error', 'POE Bulk: No jQuery.');
                return;
            }

            me._jQuery = jQuery;
        }

        let jQuery = me._jQuery;

        if (!me._jQueryAjax) {
            let jQueryAjax = jQuery.ajax;

            if (!jQueryAjax) {
                me._notify('error', 'POE Bulk: No jQuery ajax.');
                return;
            }

            me._jQueryAjax = jQueryAjax;
        }

        if (!me._mutationObserver) {
            me._mutationObserver = new MutationObserver(me._onMutation);
        }

        let $results = jQuery('.results');

        if (!$results.length) {
            me._notify('error', 'POE Bulk: No result container.');
            return;
        }

        me._mutationObserver.disconnect();
        me._mutationObserver.observe($results.get(0), { childList: true, subtree: true });
        jQuery.ajax = me._ajax;

        me._notify('success', 'POE Bulk has started.');
    },
    stop: function() {
        let me = BULK;
        let jQuery = me._jQuery;
        let jQueryAjax = me._jQueryAjax;
        let mutationObserver = me._mutationObserver;

        if (jQuery && jQueryAjax) {
            jQuery.ajax = jQueryAjax;
        }

        if (mutationObserver) {
            mutationObserver.disconnect();
        }
    },
    _ajax: function(url, options) {
        let me = BULK;
        let jQuery = me._jQuery;
        let jQueryAjax = me._jQueryAjax;
        let jqXhr = jQueryAjax(url, options);

        return jQuery.extend({}, jqXhr, jqXhr.pipe(me._onAjax));
    },
    _notify: function(state, message) {
        let me = BULK;
        let notification = me._notification;
        let jQuery = me._jQuery;
        let $notification = jQuery(me._TEMPLATES.NOTIFICATION.replace('STATE', state).replace('MESSAGE', message));

        if (notification) {
            notification.remove();
        }

        jQuery('body').append($notification);

        notification = $notification;

        setTimeout(function() {
            if (notification) {
                notification.remove();
            }
        }, 2500);
    },
    _onAjax: function(data) {
        let me = BULK;

        if (data && data.result) {
            for (const result of data.result) {
                if (result.id && result.listing && result.item) {
                    me._itemById[result.id] = result;
                }
            }
        }

        return data;
    },
    _onMutation: function(mutationRecords) {
        let me = BULK;

        mutationRecords.forEach(me._onMutationRecord);
    },
    _onMutationRecord: function(mutationRecord) {
        let me = BULK;

        mutationRecord.addedNodes.forEach(me._onMutationRecordAdded);
    },
    _onMutationRecordAdded: function(node) {
        let me = BULK;
        let jQuery = me._jQuery;
        let $node = jQuery(node);

        if ($node.is('[data-id]')) {
            let item = me._itemById[$node.attr('data-id')];

            if (item) {
                let listingJSON = item.listing;
                let whisper = listingJSON.whisper;

                if (whisper) {
                    let itemJSON = item.item;
                    let stackSize = itemJSON.stackSize;

                    if (stackSize && 1 < stackSize) {
                        let league = itemJSON.league;

                        if (league) {
                            let accountJSON = listingJSON.account;
                            let lastCharacterName = accountJSON.lastCharacterName;

                            if (lastCharacterName) {
                                let priceJSON = listingJSON.price;
                                let amount = priceJSON.amount;

                                if (amount) {
                                    let currency = priceJSON.currency;

                                    if (currency) {
                                        let name = itemJSON.typeLine;

                                        if (itemJSON.name) {
                                            name = itemJSON.name + ' ' + name;
                                        }

                                        whisper = '@' + lastCharacterName + ' Hi, I\'d like to buy your ' + stackSize + ' ' + name + ' for my ' + (stackSize * amount) + ' ' + currency + ' in ' + league + '.';
                                    }
                                }
                            }
                        }
                    }

                    let $div = jQuery(me._TEMPLATES.TEXTAREA.replace('WHISPER', whisper));
                    $node.after($div);

                    let $textarea = $div.find('textarea');
                    let callback = function () {
                        jQuery(this).select();
                    };

                    $textarea
                        .focus(callback)
                        .click(callback)
                        .on('copy', function () {
                            jQuery(this).attr('style', 'font-family:FontinSmallcaps,serif;background-color:rgb(9,9,9);');
                        })
                    ;

                    $textarea.select();
                }
            }
        }
    }
};

BULK.start();
