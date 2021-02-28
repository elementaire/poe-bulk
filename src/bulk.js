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
        TEXTAREA: '<div class="row" data-bulk-id="ID"><div style="margin:0 auto;width:50%;padding:5px;font-family:FontinSmallcaps,serif;"><textarea class="form-control text-center" rows="1" readonly>WHISPER</textarea></div></div>'
    },
    start: function() {
        let me = BULK;

        if (!me._jQuery) {
            let jQuery = $;

            if (!jQuery) {
                console.error('POE Bulk: No jQuery.');
                return;
            }

            me._jQuery = jQuery;
        }

        if (!MutationObserver) {
            me._notify('error', 'POE Bulk: No MutationObserver.');
            return;
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
    _buildWhisper: function (item) {
        let whisper = item.whisper;
        let stock = item.stock;
        let inAmount = item.inAmount;
        let outAmount = item.outAmount;
        let outCurrency = item.outCurrency;

        if (inAmount && outAmount && outCurrency) {
            let price = stock * outAmount / inAmount;

            if (/\{0}/.test(whisper)) {
                whisper = whisper.replace('{0}', stock).replace('{1}', 'exalted' === outCurrency ? Math.ceil(price * 100) / 100 : Math.ceil(price));
            } else if (1 < stock) {
                let label = item.typeLine;
                let lastCharacterName = item.lastCharacterName;
                let league = item.league;

                if (label && lastCharacterName && league) {
                    let name = item.name;

                    if (name) {
                        label = item.name + ' ' + label;
                    }

                    whisper = '@' + lastCharacterName + ' Hi, I\'d like to buy your ' + stock + ' ' + label + ' for my ' + ('exalted' === outCurrency ? Math.ceil(price * 100) / 100 : Math.ceil(price)) + ' ' + outCurrency + ' in ' + league + '.';
                }
            }
        }

        return whisper;
    },
    _garbage: function () {
        let me = BULK;
        let jQuery = me._jQuery;
        let idToRemove = [];
        let shouldGarbage = false;

        for (const id in me._itemById) {
            if (me._itemById.hasOwnProperty(id)) {
                let item = me._itemById[id];

                if (item.mustBeGarbage) {
                    jQuery('.gone[data-id="' + id + '"]').next('[data-bulk-id="' + id + '"]').remove();

                    if (item.couldBeGarbage) {
                        idToRemove.push(id);
                    } else {
                        shouldGarbage = true;
                    }
                }
            }
        }

        for (const id of idToRemove) {
            delete me._itemById[id];
        }

        if (shouldGarbage) {
            window.setTimeout(me._garbage, 350);
        }
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
        if (data && data.result) {
            let me = BULK;
            let jQuery = me._jQuery;

            for (const result of data.result) {
                let listingJSON = result.listing || {};

                let id = result.id || null;
                let gone = result.gone || false;
                let whisper = listingJSON.whisper || null;

                if (id) {
                    let $bulks = jQuery('[data-bulk-id="' + id + '"]');

                    if (gone) {
                        $bulks.remove();
                    } else if (whisper) {
                        let itemJSON = result.item || {};
                        let accountJSON = listingJSON.account || {};
                        let priceJSON = listingJSON.price || {};
                        let priceExchangeJSON = priceJSON.exchange || {};
                        let priceItemJSON = priceJSON.item || {};

                        let itemData = {
                            id,
                            gone,
                            inAmount: priceItemJSON.amount || 1,
                            inCurrency: priceItemJSON.currency || null,
                            lastCharacterName: accountJSON.lastCharacterName || null,
                            league: itemJSON.league || null,
                            name: itemJSON.name || null,
                            outAmount: priceExchangeJSON.amount || priceJSON.amount || null,
                            outCurrency: priceExchangeJSON.currency || priceJSON.currency || null,
                            stock: priceItemJSON.stock || itemJSON.stackSize || 1,
                            typeLine: itemJSON.typeLine || null,
                            whisper,
                            mustBeGarbage: 0 < $bulks.length,
                            couldBeGarbage: false
                        };

                        me._itemById[result.id] = itemData;

                        if ($bulks.length) {
                            $bulks.find('textarea').val(me._buildWhisper(itemData)).attr('style', '');
                            window.setTimeout(me._garbage, 350);
                        }
                    }
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
            let id = $node.attr('data-id');
            let item = me._itemById[id];

            if (item) {
                if (!item.gone) {
                    let whisper = me._buildWhisper(item);

                    let $div = jQuery(me._TEMPLATES.TEXTAREA.replace('ID', id).replace('WHISPER', whisper));
                    $node.after($div);

                    let $textarea = $div.find('textarea');
                    let callback = function () {
                        jQuery(this).select();
                    };

                    $textarea
                        .focus(callback)
                        .click(callback)
                        .on('copy', function () {
                            jQuery(this).attr('style', 'background-color:rgb(9,9,9);border-bottom:1px solid #4dc64d;');
                        })
                    ;

                    $textarea.select();
                }

                if (item.mustBeGarbage) {
                    item.couldBeGarbage = true;
                    me._garbage();
                } else {
                    delete me._itemById[id];
                }
            }
        }
    }
};

BULK.start();
