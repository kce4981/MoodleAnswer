'use strict';


const data = chrome.storage.local;
const cmid = detectURL()[1];

// left for debug purposes
// console.log(`Test: ${isTest()}, Review: ${isReview()}, Attemp: ${isAttemp()}`);
// console.log(getData(cmid));

if (isTest()) {
    if (isReview()) data.set(stripTestAns());
    else if (isAttemp()) {
        getData(cmid).then( val => {
            fillTestAns(val);
        })
    }
}
else {
    if (isReview()) {
        data.set(stripAns());
    }
    
    else if (isAttemp()) {
        getData(cmid).then((val) => {
            console.log(val);
            if (val != undefined) fillAns(val);
        })
    }
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
    let _cmid = url.searchParams.get("cmid")
    return [type, _cmid]
}

function isAttemp() {
    let res = detectURL();
    return res[0] == 'attempt' && res[1] != null ? true : false;
}

function isReview() {
    let res = detectURL();
    return res[0] == 'review' && res[1] != null ? true : false;
}

function isTest() {
    if (document.getElementsByClassName('que multichoice').length == 0) return false
    return true
}

function stripAns() {
    function process(rawAns) {
        var exp = /(答錯)|(答對)|(沒被回答)|(正確答案是：)|(得分 \d\/配分\d)/g
        return rawAns.replace(exp, '');
    }
    var ansBox = document.getElementsByClassName("feedbackspan yui3-overlay-content yui3-widget-stdmod");
    var ans = [];

    for (let item of ansBox) {
        ans.push(process(item.textContent));
    }
    

    return JSON.parse(`{"${cmid}":${JSON.stringify(ans)}}`);
}

function stripTestAns() {
    function process(rawAns) {
        let exp = /(回饋)|(你答錯了!)|(沒被回答)|(正確答案：)/g
        return rawAns.replace(exp, '');
    }

    var ans = []
    for (const element of document.getElementsByClassName('rightanswer')) {
        ans.push(process(element.textContent));
    }

    // c 
    console.log(ans);

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

function fillTestAns(Answers) {
    let ansBoxes = document.getElementsByClassName('que multichoice');
    for (let ansBox of ansBoxes) {
        let idx = Number(ansBox.getElementsByClassName('qno')[0].textContent)-1;
        for (let eachAns of ansBox.getElementsByClassName('flex-fill ml-1')) {
            // c
            console.log(`ans: ${eachAns.textContent}, Stored: ${Answers[idx]}`)
            if (eachAns.textContent == Answers[idx]) {
                eachAns.parentElement.parentElement.getElementsByTagName('input')[0].checked = true;
            }
        }

    }
}