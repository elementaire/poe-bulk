javascript:"use strict";window.BULK&&BULK.stop(),window.BULK={_itemById:[],_jQuery:null,_jQueryAjax:null,_mutationObserver:null,_notification:null,_TEMPLATES:{NOTIFICATION:'<div class="toast-container toast-bottom-center"><div class="toast toast-STATE" style="display: block;"><div class="toast-title"></div> <div class="toast-message">MESSAGE</div></div></div>',TEXTAREA:'<div class="row"><div style="margin:0 auto;width:50%;padding:5px;"><textarea class="form-control text-center" rows="1" readonly="" style="font-family:FontinSmallcaps,serif;">WHISPER</textarea></div></div>'},start:function(){let t=BULK;if(!MutationObserver)return void t._notify("error","POE Bulk: No MutationObserver.");if(!t._jQuery){let e=$;if(!e)return void t._notify("error","POE Bulk: No jQuery.");t._jQuery=e}let e=t._jQuery;if(!t._jQueryAjax){let i=e.ajax;if(!i)return void t._notify("error","POE Bulk: No jQuery ajax.");t._jQueryAjax=i}t._mutationObserver||(t._mutationObserver=new MutationObserver(t._onMutation));let i=e(".results");i.length?(t._mutationObserver.disconnect(),t._mutationObserver.observe(i.get(0),{childList:!0,subtree:!0}),e.ajax=t._ajax,t._notify("success","POE Bulk has started.")):t._notify("error","POE Bulk: No result container.")},stop:function(){let t=BULK,e=t._jQuery,i=t._jQueryAjax,o=t._mutationObserver;e&&i&&(e.ajax=i),o&&o.disconnect()},_ajax:function(t,e){let i=BULK,o=i._jQuery,r=(0,i._jQueryAjax)(t,e);return o.extend({},r,r.pipe(i._onAjax))},_notify:function(t,e){let i=BULK,o=i._notification,r=i._jQuery,n=r(i._TEMPLATES.NOTIFICATION.replace("STATE",t).replace("MESSAGE",e));o&&o.remove(),r("body").append(n),o=n,setTimeout(function(){o&&o.remove()},2500)},_onAjax:function(t){let e=BULK;if(t&&t.result)for(const i of t.result)i.id&&i.listing&&i.item&&(e._itemById[i.id]=i);return t},_onMutation:function(t){let e=BULK;t.forEach(e._onMutationRecord)},_onMutationRecord:function(t){let e=BULK;t.addedNodes.forEach(e._onMutationRecordAdded)},_onMutationRecordAdded:function(t){let e=BULK,i=e._jQuery,o=i(t);if(o.is("[data-id]")){let t=e._itemById[o.attr("data-id")];if(t){let r=t.listing,n=r.whisper;if(n){let a=t.item,l=a.stackSize;if(l&&1<l){let t=a.league;if(t){let e=r.account.lastCharacterName;if(e){let i=r.price,o=i.amount;if(o){let r=i.currency;if(r){let i=a.typeLine;a.name&&(i=a.name+" "+i),n="@"+e+" Hi, I'd like to buy your "+l+" "+i+" for my "+l*o+" "+r+" in "+t+"."}}}}}let s=i(e._TEMPLATES.TEXTAREA.replace("WHISPER",n));o.after(s);let u=s.find("textarea"),d=function(){i(this).select()};u.focus(d).click(d).on("copy",function(){i(this).attr("style","font-family:FontinSmallcaps,serif;background-color:rgb(9,9,9);border-bottom:1px solid #4dc64d;")}),u.select()}delete e._itemById[o.attr("data-id")]}}}},BULK.start();