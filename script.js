// ==UserScript==
// @name         BitMex USD Converter
// @namespace    https://bitmex.com/
// @version      0.11
// @description  Get some sanity into your gambling.
// @author       koinkraft
// @grant        none
// @include      https://bitmex.com/*
// @include      https://www.bitmex.com/*
// @require      https://code.jquery.com/jquery-2.1.4.min.js
// ==/UserScript==

(function() {
    'use strict';

    // Script vars
    let indexPrice = 0;
    let currentBalance = {total: 0, avail: 0};
    var $ = window.jQuery;

    // Extract BitMex price
    const updateIndexPrice = () => {
        $('.instrument').each(function() {
            let obj = this;
            if($(obj).children('.symbol').length > 0 && $(obj).children('.symbol').html() == '.BXBT') {
                indexPrice = $(obj).children('.price').html();
            }
        });
        setTimeout(function() {
            updateIndexPrice();
        }, 1000);
    };

    // Extract Wallet Balance
    const extractWalletBalance = (callback) => {
        let balances = currentBalance;
        $('a[href="/app/wallet"] > span > table > tbody > tr').each(function() {
            let currentLabel = '';
            $(this).children('td').each(function() {
                if($(this).html() == 'Total' || $(this).html() == 'Avail') {
                    currentLabel = $(this).html();
                } else {
                    if(currentLabel == 'Total') {
                        let balanceTotal = formatXBTString($(this).html());
                        if(balanceTotal !== false) balances.total = balanceTotal;
                    } else if(currentLabel == 'Avail') {
                        let balanceAvail = formatXBTString($(this).html());
                        if(balanceAvail !== false) balances.avail = balanceAvail;
                    }
                }
            });
        });
        currentBalance = balances;
        callback(balances);
    };

    // Set USD Wallet Balance
    const setWalletBalance = (updatedBalances) => {
        if(updatedBalances.total + ' USD' != $('.balance-usd-total').html()) $('.balance-usd-total').html(updatedBalances.total + ' USD');
        if(updatedBalances.avail + ' USD' != $('.balance-usd-avail').html()) $('.balance-usd-avail').html(updatedBalances.avail + ' USD');
    };

    // Convert XBT String
    const formatXBTString = (string) => {
        let parts = string.split(" ");
        if(parts.length == 2) {
            if(parts[1] == 'XBT') {
                return parts[0].replace(",",".");
            } else if(parts[1] == 'mXBT') {
                return parts[0].replace(",",".")*0.001;
            } else if(parts[1] == 'XBt') {
                return parts[0].replace(".","")*0.00001;
            } else if(parts[1] == 'μXBT') {
                return parts[0].replace(".","").replace(",",".")*0.000001;
            }
        }
        return false;
    };

    // Update Wallet Balances
    const updateWalletBalances = () => {
        setTimeout(function() {
            if(indexPrice != 0) {
                extractWalletBalance(function(balances) {
                    let updatedBalances = {total: (balances.total*indexPrice).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}), avail: (balances.avail*indexPrice).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})};
                    setWalletBalance(updatedBalances);
                });
            }
            updateWalletBalances();
        }, 1000);
    };

    // Update PNLs
    const updatePNLs = (setTimeoutCycle) => {
        if(indexPrice != 0) {
            // Unrealized PNL
            $('td.unrealisedPnl').each(function() {
                let obj = this;
                let content;
                let isSpan = false;
                if($(this).children('div:first-child').children('span').length > 0) {
                    content = $(this).children('div:first-child').children('span:first-child').html();
                    isSpan = true;
                } else {
                    content = $(this).children('div:first-child').html();
                }
                let parts = content.split(" ");
                if(parts[1] == 'XBT' || parts[1] == 'mXBT' || parts[1] == 'XBt' || parts[1] == 'μXBT') {
                    let formatUnrealizedPNL = formatXBTString(parts[0] + ' ' + parts[1]);
                    let unrealizedPNLUSD = (formatUnrealizedPNL*indexPrice).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
                    let newDivContent;
                    if(!isSpan) {
                        newDivContent = unrealizedPNLUSD + ' USD | ' + ' BTC ' + formatUnrealizedPNL + ' ' + parts[2];
                    } else {
                        newDivContent = '<span style="background:rgba(86,188,118,0.25);" class="' + ( formatUnrealizedPNL*indexPrice < 0 ? 'neg' : 'pos' ) + ' tooltipWrapper hovered">' + unrealizedPNLUSD + ' USD | ' + ' BTC ' + formatUnrealizedPNL + ' ' + parts[2] + '</span>';
                    }
                    if(newDivContent != $(obj).children('div.unrealizedPnlUSD').html()) {
                        $(obj).children('div.unrealizedPnlUSD').html(newDivContent);
                        if(formatUnrealizedPNL*indexPrice < 0) {
                            if(!$(obj).children('div.unrealizedPnlUSD').hasClass('neg')) {
                                $(obj).children('div.unrealizedPnlUSD').addClass('neg').removeClass('pos');
                            }
                        } else {
                            if(!$(obj).children('div.unrealizedPnlUSD').hasClass('pos')) {
                                $(obj).children('div.unrealizedPnlUSD').addClass('pos').removeClass('neg');
                            }
                        }
                    }
                }
            });

            // Realized PNL
            $('td.combinedRealisedPnl').each(function() {
                let obj = this;
                let realizedPNLhover = formatXBTString($(obj).children('.hoverContainer:first-child').children('.hoverVisible').children('.tooltipWrapper').children('span').html());
                let realizedPNL = formatXBTString($(obj).children('.hoverContainer:first-child').children('.hoverHidden').children('span').html());
                let realizedPNLUSDhoverContent = (realizedPNLhover*indexPrice).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' USD';
                let realizedPNLUSDContent = (realizedPNL*indexPrice).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' USD';
                if($(obj).children('.realizedPNLContainer').children('.hoverVisible').children('.tooltipWrapper').children('span').html() != realizedPNLUSDhoverContent) {
                    $(obj).children('.realizedPNLContainer').children('.hoverVisible').children('.tooltipWrapper').children('span').html(realizedPNLUSDhoverContent);
                    if(realizedPNLhover*indexPrice < 0) {
                        if(!$(obj).children('.realizedPNLContainer').children('.hoverVisible').children('.tooltipWrapper').children('span').hasClass('neg')) {
                            $(obj).children('.realizedPNLContainer').children('.hoverVisible').children('.tooltipWrapper').children('span').addClass('neg').removeClass('pos');
                        }
                    } else {
                        if(!$(obj).children('.realizedPNLContainer').children('.hoverVisible').children('.tooltipWrapper').children('span').hasClass('pos')) {
                           $(obj).children('.realizedPNLContainer').children('.hoverVisible').children('.tooltipWrapper').children('span').addClass('pos').removeClass('neg');
                        }
                    }
                }
                if($(obj).children('.realizedPNLContainer').children('.hoverHidden').children('span').html() != realizedPNLUSDContent) {
                    $(obj).children('.realizedPNLContainer').children('.hoverHidden').children('span').html(realizedPNLUSDContent);
                    if(realizedPNL*indexPrice < 0) {
                        if(!$(obj).children('.realizedPNLContainer').children('.hoverHidden').children('span').hasClass('neg')) {
                            $(obj).children('.realizedPNLContainer').children('.hoverHidden').children('span').addClass('neg').removeClass('pos');
                        }
                    } else {
                        if(!$(obj).children('.realizedPNLContainer').children('.hoverHidden').children('span').hasClass('pos')) {
                           $(obj).children('.realizedPNLContainer').children('.hoverHidden').children('span').addClass('pos').removeClass('neg');
                        }
                    }
                }
            });
        }
        if(setTimeoutCycle) {
            setTimeout(function() {
                updatePNLs(true);
            }, 50);
        }
    };

    // Initialize PNL wrapper
    const initPNLWrapper = (setTimeoutCycle) => {
        if($('td.unrealisedPnl').length > 0 && $('.unrealizedPnlUSD').length == 0) {
            // Unrealized PNL
            $('td.unrealisedPnl').css('position', 'relative');
            $('td.unrealisedPnl > div').css('opacity', '0').css('position','absolute').css('left','0').css('top','0').css('right','0').css('bottom','0');
            $('td.unrealisedPnl > div').after('<div class="unrealizedPnl unrealizedPnlUSD">0.00 USD (0.00%)</div>');

            // Realized PNL
            $('td.combinedRealisedPnl > .hoverContainer').hide();
            $('td.combinedRealisedPnl > .hoverContainer').after('<span class="hoverContainer realizedPNLContainer"><span class="hoverVisible"><span class="tooltipWrapper"><span>0.00 USD</span></span></span><span class="hoverHidden"><span>0.00 USD</span></span></span>');
        }
        if(setTimeoutCycle) {
            setTimeout(function() {
                initPNLWrapper(true);
            }, 100);
        }
    };

    // Wait for window to load
    $(window).load(function() {

        // Hide BTC balance box
        $('._1mNCXSUh:first').hide();
        $('._2UCMYPbC > ._2wx45MYS:first').hide();

        // Init PNL Wrapper
        initPNLWrapper(true);
        $(window).resize(function() {
            initPNLWrapper(false);
        });

        // Insert USD Balance div
        $('.announcementsDropdown').before('<a class="_1mNCXSUh usdBalance noHover" href="/app/wallet"><span class="noBorder tooltipWrapper"><table class="visible-lg visible-md"><tbody><tr><td class="_39qDSUxb">Total</td><td class="balance-usd-total">0.00 USD</td></tr><tr><td class="_39qDSUxb">Avail</td><td class="balance-usd-avail">0.00 USD</td></tr></tbody></table></span></a><span class="_2wx45MYS visible-lg visible-md"></span>');

        // Update Functions
        setInterval(() => {
            console.log('Updating....');
            updateIndexPrice();
            updateWalletBalances();
            updatePNLs(true);
            $('td.unrealisedPnl > div').hover(function() {
                updatePNLs(false);
            });
        }, 30000);
    });

})();
