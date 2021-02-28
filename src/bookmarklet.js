"use strict";

document.querySelectorAll('#bulk').forEach(function (script) {
    script.remove();
});

document.querySelectorAll('body').forEach(function (body) {
    let script = document.createElement('script');
    script.setAttribute('src', 'https://cdn.jsdelivr.net/gh/elementaire/poe-bulk/src/bulk.js');
    script.setAttribute('id', 'bulk');
    body.appendChild(script);
});