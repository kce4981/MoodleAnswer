'use strict';


let data = chrome.storage.local;

if (isReview()) {
    data.set(stripAns());
}

if (isAttemp()) {
    let cmid = detectURL()[1];
    getData(cmid).then((val) => {
        console.log(val);
        if (val != undefined) fillAns(val);
    })
}

// https://stackoverflow.com/questions/37700051/chrome-extension-is-there-any-way-to-make-chrome-storage-local-get-return-so
// stolen from stack :>
function getData(sKey) {
    return new Promise(function(resolve, reject) {
      chrome.storage.local.get(sKey, function(items) {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
          reject(chrome.runtime.lastError.message);
        } else {
          resolve(items[sKey]);
        }
      });
    });
}


function detectURL(){
    // http://infotech.pcsh.ntpc.edu.tw/mod/quiz/review.php?attempt=784&cmid=1706
    // http://infotech.pcsh.ntpc.edu.tw/mod/quiz/attempt.php?attempt=13228&cmid=1706
    // http://infotech.pcsh.ntpc.edu.tw/mod/quiz/attempt.php?attempt=13187&cmid=1749
    
    let url = new URL(window.location.href);
    if (url.pathname.split('/')[3] == undefined) {
        return [undefined, undefined]
    }
    let type = url.pathname.split('/')[3].split('.')[0]
    let cmid = url.searchParams.get("cmid")
    return [type, cmid]
}

function isAttemp() {
    let res = detectURL();
    return res[0] == 'attempt' && res[1] != null ? true : false;
}

function isReview() {
    let res = detectURL();
    return res[0] == 'review' && res[1] != null ? true : false;
}

function stripAns() {
    var ansBox = document.getElementsByClassName("feedbackspan yui3-overlay-content yui3-widget-stdmod");
    var ans = [];

    for (let item of ansBox) {
        ans.push(process(item.textContent));
    }
    
    function process(rawAns) {
        var exp = /(答錯)|(答對)|(沒被回答)|(正確答案是：)|(得分 \d\/配分\d)/g
        return rawAns.replace(exp, '');
    }

    let cmid = detectURL()[1].toString();
    return JSON.parse(`{"${cmid}":${JSON.stringify(ans)}}`);
}

function fillAns(Answers) {
    var inputs = document.querySelectorAll('.form-control,.select');

    for (let i = 0; i < Answers.length; i++) {
        let ans = Answers[i];
        let AnsBox = inputs[i];
        if (AnsBox.nodeName == 'INPUT') {
            AnsBox.defaultValue = ans;
        }
        else if (AnsBox.nodeName == 'SELECT') {
            var val;
            AnsBox.childNodes.forEach(element => {if (element.textContent == ans) val = element.value;});
            AnsBox.value = val;
        }
    }
}
