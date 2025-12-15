"use strict";

window.BULK && BULK.stop();

window.BULK = {
    _controls: null,
    _itemById: [],
    _jQuery: null,
    _jQueryAjax: null,
    _mutationObserver: null,
    _notification: null,
    _TEMPLATES: {
        NOTIFICATION: '<div class="toast-container toast-bottom-center"><div class="toast toast-STATE" style="display: block;"><div class="toast-title"></div> <div class="toast-message">MESSAGE</div></div></div>',
        TEXTAREA: '<div class="row" data-bulk-id="ID"><div style="margin:0 auto;width:50%;padding:5px;font-family:FontinSmallcaps,serif;"><textarea class="form-control text-center" rows="1" readonly>WHISPER</textarea></div></div>',
        CONTROLS: '<div class="filter-group" id="bulk-controls"><div class="filter-group-header"><div class="filter"><span class="input-group-btn" style="visibility:hidden;"><button class="btn toggle-btn"></button></span><span class="filter-body"><span class="filter-title filter-title-clickable"><span>POE Bulk</span></span></span></div></div><div class="filter-group-body"><div class="filter filter-property"><span class="filter-body"><div class="filter-title">Quantity</div><span class="sep"></span><input type="number" placeholder="min" maxlength="4" pattern="[0-9]*" min="1" inputmode="numeric" step="any" class="form-control minmax" id="bulk-controls-quantity-min"><span class="sep"></span><input type="number" placeholder="max" maxlength="4" pattern="[0-9]*" min="1" inputmode="numeric" step="any" class="form-control minmax" id="bulk-controls-quantity-max"></span></div><div class="filter filter-property"><span class="filter-body"><div class="filter-title">Buyout Bulk Price</div><span class="sep"></span><input type="number" placeholder="max" maxlength="4" pattern="[0-9.,]*" min="0" inputmode="numeric" step="any" class="form-control minmax" id="bulk-controls-price-max"></span></div><div class="filter filter-property full-span"><span class="filter-body"><div class="filter-title">Automatic sending of whisper or trading</div><span class="sep"></span><label style="display:flex;justify-content:center;align-items: center;background:#1e2124;height:30px;width:30px;float:left;margin:0;cursor:pointer;"><input type="checkbox" style="display:block;border:2px solid #634928;background:#000000;" id="bulk-controls-sending"></label></span></div><div class="filter filter-property full-span"><span class="filter-body"><div class="filter-title">Force trading when the item is in demand</div><span class="sep"></span><label style="display:flex;justify-content:center;align-items: center;background:#1e2124;height:30px;width:30px;float:left;margin:0;cursor:pointer;"><input type="checkbox" style="display:block;border:2px solid #634928;background:#000000;" id="bulk-controls-sending-force"></label></span></div></div></div>'
    },
    start: function() {
        const me = BULK;

        if (!MutationObserver) {
            me._notify('error', 'POE Bulk: No MutationObserver.');
            return;
        }

        if (!me._jQuery) {
            const jQuery = $;

            if (!jQuery) {
                console.error('POE Bulk: No jQuery.');
                return;
            }

            me._jQuery = jQuery;
        }

        const jQuery = me._jQuery;

        if (!me._jQueryAjax) {
            const jQueryAjax = jQuery.ajax;

            if (!jQueryAjax) {
                me._notify('error', 'POE Bulk: No jQuery ajax.');
                return;
            }

            me._jQueryAjax = jQueryAjax;
        }

        if (!me._mutationObserver) {
            me._mutationObserver = new MutationObserver(me._onMutation);
        }

        const $results = jQuery('.results');

        if (!$results.length) {
            me._notify('error', 'POE Bulk: No result container.');
            return;
        }

        if (!me._controls) {
            const $filtersContainer = jQuery('.search-advanced-pane.blue');

            if (!$filtersContainer.length) {
                me._notify('error', 'POE Bulk: No filters container.');
                return;
            }

            me._controls = jQuery(me._TEMPLATES.CONTROLS);
            $filtersContainer.append(me._controls);
        }

        me._mutationObserver.disconnect();
        me._mutationObserver.observe($results.get(0), { attributeFilter: ['class'], childList: true, subtree: true });
        jQuery.ajax = me._ajax;

        me._notify('success', 'POE Bulk has started.');
    },
    stop: function() {
        const me = BULK;
        const controls = me._controls;
        const jQuery = me._jQuery;
        const jQueryAjax = me._jQueryAjax;
        const mutationObserver = me._mutationObserver;
        const notification = me._notification;

        if (controls) {
            controls.remove();
        }

        if (jQuery && jQueryAjax) {
            jQuery.ajax = jQueryAjax;
        }

        if (mutationObserver) {
            mutationObserver.disconnect();
        }

        if (notification) {
            notification.remove();
        }

        me._controls = null;
        me._itemById = [];
        me._jQuery = null;
        me._jQueryAjax = null;
        me._mutationObserver = null;
        me._notification = null;
    },
    _ajax: function(url, options) {
        const me = BULK;
        const jQuery = me._jQuery;
        const jQueryAjax = me._jQueryAjax;
        const jqXhr = jQueryAjax(url, options);

        return jQuery.extend({}, jqXhr, jqXhr.pipe(me._onAjax));
    },
    _buildWhisper: function (item) {
        const whisper = item.whisper;
        const stock = item.stock;
        const inAmount = item.inAmount;
        const outAmount = item.outAmount;
        const outCurrency = item.outCurrency;

        if (inAmount && outAmount && outCurrency) {
            const quantityMax = parseInt($('#bulk-controls-quantity-max').val().replace(',','.'));
            const maxPrice = parseFloat($('#bulk-controls-price-max').val().replace(',','.'));
            const oneItemPrice = outAmount / inAmount;
            const maxPriceStock = isNaN(maxPrice) ? null : Math.floor(maxPrice / oneItemPrice);
            const stockToBuy = Math.min(...[stock, quantityMax, maxPriceStock].filter((number) => null !== number && !isNaN(number)));
            const price = stockToBuy * oneItemPrice;
            const priceToBuy = 'divine' === outCurrency ? Math.ceil(price * 100) / 100 : Math.ceil(price);

            if (/\{0}/.test(whisper)) {
                return whisper.replace('{0}', stockToBuy).replace('{1}', priceToBuy);
            }

            if (1 < stock) {
                let label = item.typeLine;
                const lastCharacterName = item.lastCharacterName;
                const league = item.league;

                if (label && lastCharacterName && league) {
                    const name = item.name;

                    if (name) {
                        label = name + ' ' + label;
                    }

                    return '@' + lastCharacterName + ' Hi, I\'d like to buy your ' + stockToBuy + ' ' + label + ' for my ' + priceToBuy + ' ' + outCurrency + ' in ' + league + '.';
                }
            }
        }

        return whisper;
    },
    _garbage: function () {
        const me = BULK;
        const jQuery = me._jQuery;
        const idToRemove = [];
        let shouldGarbage = false;

        for (const id in me._itemById) {
            if (me._itemById.hasOwnProperty(id)) {
                const item = me._itemById[id];

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
        const me = BULK;
        const notification = me._notification;
        const jQuery = me._jQuery;
        const $notification = jQuery(me._TEMPLATES.NOTIFICATION.replace('STATE', state).replace('MESSAGE', message));

        if (notification) {
            notification.remove();
        }

        jQuery('body').append($notification);

        me._notification = $notification;

        setTimeout(function() {
            const notification = me._notification;

            if (notification) {
                notification.remove();
                me._notification = null;
            }
        }, 2500);
    },
    _onAjax: function(data) {
        if (data && data.result) {
            const me = BULK;
            const jQuery = me._jQuery;

            for (const result of data.result) {
                const id = result.id || null;

                if (id) {
                    const gone = result.gone || false;
                    const listingJSON = result.listing || {};
                    const hideout = listingJSON.hideout_token || null;
                    const whisper = listingJSON.whisper || null;
                    const $bulks = jQuery('[data-bulk-id="' + id + '"]');

                    if (gone) {
                        $bulks.remove();
                    } else if (hideout) {
                        me._itemById[id] = {
                            id,
                            gone,
                            hideout: true,
                            mustBeGarbage: 0 < $bulks.length,
                            couldBeGarbage: false
                        };

                        if ($bulks.length) {
                            window.setTimeout(me._garbage, 350);
                        }
                    } else if (whisper) {
                        const itemJSON = result.item || {};
                        const accountJSON = listingJSON.account || {};
                        const priceJSON = listingJSON.price || {};
                        const priceItemJSON = priceJSON.item || {};

                        me._itemById[id] = {
                            id,
                            gone,
                            hideout: false,
                            inAmount: priceItemJSON.amount || 1,
                            inCurrency: priceItemJSON.currency || null,
                            lastCharacterName: accountJSON.lastCharacterName || null,
                            league: itemJSON.league || null,
                            name: itemJSON.name || null,
                            outAmount: priceJSON.amount || null,
                            outCurrency: priceJSON.currency || null,
                            stock: priceItemJSON.stock || itemJSON.stackSize || 1,
                            typeLine: itemJSON.typeLine || null,
                            whisper,
                            mustBeGarbage: 0 < $bulks.length,
                            couldBeGarbage: false
                        };

                        if ($bulks.length) {
                            $bulks.find('textarea').val(me._buildWhisper(me._itemById[id])).attr('style', '');
                            window.setTimeout(me._garbage, 350);
                        }
                    }
                }
            }
        }

        return data;
    },
    _onMutation: function(mutationRecords) {
        mutationRecords.forEach(BULK._onMutationRecord);
    },
    _onMutationRecord: function(mutationRecord) {
        const me = BULK;

        mutationRecord.addedNodes.forEach(me._onMutationRecordAdded);

        if ('attributes' === mutationRecord.type) {
            BULK._onMutationRecordAttributeEdited(mutationRecord);
        }
    },
    _onMutationRecordAdded: function(node) {
        const me = BULK;
        const jQuery = me._jQuery;
        const $node = jQuery(node);

        if ($node.is('[data-id]')) {
            const id = $node.attr('data-id');
            const item = me._itemById[id];

            if (item) {
                if (item.hideout) {
                    if (jQuery('#bulk-controls-sending').is(':checked')) {
                        $node.find('.direct-btn:not(.disabled)').trigger('click');
                    }
                } else {
                    const quantityMin = parseInt($('#bulk-controls-quantity-min').val().replace(',', '.'));
                    const quantityMax = parseInt($('#bulk-controls-quantity-max').val().replace(',', '.'));
                    const maxPrice = parseFloat($('#bulk-controls-price-max').val().replace(',', '.'));
                    const maxPriceStock = isNaN(maxPrice) ? null : Math.floor(maxPrice / (item.outAmount / item.inAmount));

                    if ((!isNaN(quantityMin) && item.stock < quantityMin) || (!isNaN(quantityMax) && quantityMax <= 0) || (null !== maxPriceStock && maxPriceStock <= 0)) {
                        $node.remove();
                    } else if (!item.gone) {
                        const whisper = me._buildWhisper(item);

                        const $div = jQuery(me._TEMPLATES.TEXTAREA.replace('ID', id).replace('WHISPER', whisper));
                        $node.after($div);

                        const $textarea = $div.find('textarea');
                        const callback = function () {
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

                        if (jQuery('#bulk-controls-sending').is(':checked')) {
                            $node.find('.direct-btn:not(.disabled)').trigger('click');
                        }
                    }
                }

                if (item.mustBeGarbage) {
                    item.couldBeGarbage = true;
                    me._garbage();
                } else {
                    delete me._itemById[id];
                }
            }
        }
    },
    _onMutationRecordAttributeEdited: function(mutationRecord) {
        const jQuery = BULK._jQuery;
        const $target = jQuery(mutationRecord.target);

        if ($target.is('.direct-btn.expired:not(.disabled)') && jQuery('#bulk-controls-sending').is(':checked') && jQuery('#bulk-controls-sending-force').is(':checked')) {
            $target.trigger('click');
        }
    }
};

BULK.start();
