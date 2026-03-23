/********************************************************
 * ICAR16 - FINAL RESEARCH VERSION
 * PhD Research Data Collection - Beatrice Iaria
 * Features: 16 Randomized Trials, Updated Visual Geometry
 ********************************************************/

import { core, data, sound, util, visual, hardware } from './lib/psychojs-2026.1.1.js';
const { PsychoJS } = core;
const { TrialHandler } = data;
const { Scheduler } = util;

let expName = 'ICAR16'; 
let expInfo = {'participant': ''};

const psychoJS = new PsychoJS({ debug: true });

psychoJS.openWindow({
    fullscr: true,
    color: new util.Color('black'),
    units: 'height',
    waitBlanking: true
});

psychoJS.schedule(psychoJS.gui.DlgFromDict({
    dictionary: expInfo,
    title: expName
}));

const flowScheduler = new Scheduler(psychoJS);
const dialogCancelScheduler = new Scheduler(psychoJS);
psychoJS.scheduleCondition(function() { return (psychoJS.gui.dialogComponent.button === 'OK'); }, flowScheduler, dialogCancelScheduler);

flowScheduler.add(updateInfo);
flowScheduler.add(experimentInit);
flowScheduler.add(introBegin);
flowScheduler.add(introFrame);
flowScheduler.add(introEnd);

const blocks = [
    { name: 'LN', file: 'conditions_LN.csv' },
    { name: 'VR', file: 'conditions_VR.csv' },
    { name: '3DR', file: 'conditions_3DR.csv' },
    { name: 'MX', file: 'conditions_MX.csv' }
];

for (const block of blocks) {
    const loopScheduler = new Scheduler(psychoJS);
    flowScheduler.add(trialsLoopBegin(loopScheduler, block.file, block.name));
    flowScheduler.add(loopScheduler);
    flowScheduler.add(trialsLoopEnd);
}

flowScheduler.add(quitPsychoJS);

// --- RESOURCES MANAGEMENT ---
let resources = [
    { name: 'conditions_LN.csv', path: './resources/conditions_LN.csv' },
    { name: 'conditions_VR.csv', path: './resources/conditions_VR.csv' },
    { name: 'conditions_3DR.csv', path: './resources/conditions_3DR.csv' },
    { name: 'conditions_MX.csv', path: './resources/conditions_MX.csv' }
];

for (let i = 11001; i <= 11066; i++) {
    resources.push({ name: `images/image_3DR/fig${i}.png`, path: `./resources/images/image_3DR/fig${i}.png` });
}

const mx_ids = [12043, 12044, 12045, 12046, 12047, 12048, 12050, 12053, 12054, 12055, 12056];
for (let id of mx_ids) {
    resources.push({ name: `images/image_MX/fig${id}.png`, path: `./resources/images/image_MX/fig${id}.jpg` });
}

psychoJS.start({ expName, expInfo, resources });

async function updateInfo() {
    expInfo['date'] = util.MonotonicClock.getDateStr();
    psychoJS.experiment.dataFileName = `${expInfo["participant"]}_${expName}_${expInfo['date']}`;
    return Scheduler.Event.NEXT;
}

var routineClock, mainImage, mainQ, mouse, progressBar, progressBox;
var opt_texts = [], opt_boxes = [];
var totalQuestions = 16, currentQuestionIdx = 0; 
var scores = { TOTAL: 0, LN: 0, VR: 0, '3DR': 0, MX: 0 };
var experimentClock;

const COLOR_DEFAULT = new util.Color('white');
const COLOR_HOVER   = new util.Color([0.75, 0.85, 1.0]);

var introText, startBox, startText, introMouse, introMouseWasReleased;

async function experimentInit() {
    routineClock = new util.Clock();
    
    mainImage = new visual.ImageStim({ 
        win: psychoJS.window, 
        pos: [0, 0.10], 
        size: [0.60, 0.40], 
        interpolate: true 
    });
    
    mainQ = new visual.TextStim({ 
        win: psychoJS.window, 
        font: 'Hiragino Kaku Gothic Pro', 
        pos: [0, 0.43], 
        height: 0.028, 
        color: new util.Color('white'), 
        wrapWidth: 1.2 
    });
    
    progressBox = new visual.Rect({ win: psychoJS.window, width: 0.8, height: 0.01, pos: [0, -0.48], lineColor: new util.Color('grey') });
    progressBar = new visual.Rect({ win: psychoJS.window, width: 0, height: 0.01, pos: [-0.4, -0.48], fillColor: new util.Color('white') });
    
    const x_pos = [-0.48, -0.16, 0.16, 0.48, -0.48, -0.16, 0.16, 0.48];
    const y_pos = [-0.22, -0.22, -0.22, -0.22, -0.35, -0.35, -0.35, -0.35];
    
    for (let i = 0; i < 8; i++) {
        opt_boxes[i] = new visual.Rect({ win: psychoJS.window, width: 0.3, height: 0.1, pos: [x_pos[i], y_pos[i]], lineColor: new util.Color('white'), fillColor: COLOR_DEFAULT });
        opt_texts[i] = new visual.TextStim({ win: psychoJS.window, font: 'Hiragino Kaku Gothic Pro', pos: [x_pos[i], y_pos[i]], height: 0.022, color: new util.Color('black') });
    }

    introText = new visual.TextStim({
        win: psychoJS.window,
        font: 'Hiragino Kaku Gothic Pro',
        pos: [0, 0.10],
        height: 0.038,
        color: new util.Color('white'),
        wrapWidth: 1.4,
        text: 'これからテストを始めます。\n\n画面に問題が表示されます。\n\n正しいと思う答えを、下のボックスをクリックして選んでください。\n\n準備ができたら「スタート」ボタンを押してください。'
    });

    startBox = new visual.Rect({
        win: psychoJS.window,
        width: 0.30,
        height: 0.10,
        pos: [0, -0.32],
        lineColor: new util.Color('white'),
        fillColor: new util.Color('white')
    });

    startText = new visual.TextStim({
        win: psychoJS.window,
        font: 'Hiragino Kaku Gothic Pro',
        pos: [0, -0.32],
        height: 0.040,
        color: new util.Color('black'),
        text: 'スタート'
    });

    introMouse = new core.Mouse({ win: psychoJS.window });
    mouse = new core.Mouse({ win: psychoJS.window });
    return Scheduler.Event.NEXT;
}

async function introBegin() {
    introMouseWasReleased = false;
    introText.setAutoDraw(true);
    startBox.setAutoDraw(true);
    startText.setAutoDraw(true);
    return Scheduler.Event.NEXT;
}

async function introFrame() {
    if (introMouse.getPressed()[0] === 0) introMouseWasReleased = true;

    startText.setAutoDraw(false);
    if (startBox.contains(introMouse)) {
        startBox.setFillColor(COLOR_HOVER);
    } else {
        startBox.setFillColor(COLOR_DEFAULT);
    }
    startText.setAutoDraw(true);

    if (introMouse.getPressed()[0] === 1 && introMouseWasReleased && startBox.contains(introMouse)) {
        return Scheduler.Event.NEXT;
    }
    return Scheduler.Event.FLIP_REPEAT;
}

async function introEnd() {
    introText.setAutoDraw(false);
    startBox.setAutoDraw(false);
    startText.setAutoDraw(false);
    experimentClock = new util.Clock();
    return Scheduler.Event.NEXT;
}

function trialsLoopBegin(scheduler, fileName, blockName) {
    return async function() {
        let allConditions = TrialHandler.importConditions(psychoJS.serverManager, fileName);
        util.shuffle(allConditions);
        
        let trials = new TrialHandler({ 
            psychoJS, 
            nReps: 1, 
            method: TrialHandler.Method.SEQUENTIAL, 
            trialList: allConditions.slice(0, 4), 
            name: blockName 
        });
        psychoJS.experiment.addLoop(trials);
        
        const trialIterator = trials[Symbol.iterator]();
        
        function nextTrial() {
            let stepResult = trialIterator.next();
            if (stepResult.done) return Scheduler.Event.NEXT;
            let thisTrial = stepResult.value;
            
            scheduler.add(importConditions(trials.getSnapshot()));
            scheduler.add(routineBegin(thisTrial, blockName));
            scheduler.add(routineFrame(thisTrial, blockName));
            scheduler.add(routineEnd());
            scheduler.add(nextTrial); 
            return Scheduler.Event.NEXT;
        }
        
        scheduler.add(nextTrial);
        return Scheduler.Event.NEXT;
    }
}

function routineBegin(thisTrial, blockName) {
    return async function () {
        routineClock.reset();
        window.mouseWasReleased = false; 
        currentQuestionIdx++;
        
        progressBar.setWidth((currentQuestionIdx / totalQuestions) * 0.8);
        progressBar.setPos([-0.4 + (progressBar.getWidth()/2), -0.48]);
        
        const img = thisTrial['image_file'];
        
        if (img && !img.includes('blank')) { 
            mainImage.setImage(img); 
            mainImage.setOpacity(1.0); 
            
            if (blockName === '3DR') {
                mainImage.setPos([0, 0.10]);  
                mainImage.setSize([1.10, 0.49]); 
            } else if (blockName === 'MX') {
                mainImage.setPos([0, 0.12]); 
                mainImage.setSize([0.75, 0.48]); 
            } else {
                mainImage.setPos([0, 0.10]);
                mainImage.setSize([0.60, 0.30]);
            }
            
            mainQ.setPos([0, 0.43]);
            mainQ.setHeight(0.028);
            mainQ.setWrapWidth(1.4); 
        } else { 
            mainImage.setOpacity(0.0); 
            mainQ.setPos([0, 0.15]);
            mainQ.setHeight(0.045);
            mainQ.setWrapWidth(0.85); 
        }

        mainQ.setText(thisTrial['QUESTION'] ? thisTrial['QUESTION'].toString().replace(/\\n/g, '\n') : "");
        
        for (let i = 1; i <= 8; i++) {
            let choiceText = thisTrial[`choice${i}`];
            choiceText = choiceText ? choiceText.toString().replace(/\\n/g, '\n') : "";
            opt_texts[i-1].setText(choiceText);
            opt_boxes[i-1].setFillColor(COLOR_DEFAULT);
        }
        
        // salva il numero del trial per il blocco corrente
        psychoJS.experiment.addData('block', blockName);
        psychoJS.experiment.addData('trial_n', currentQuestionIdx);
        return Scheduler.Event.NEXT;
    }
}

function routineFrame(thisTrial, blockName) {
    return async function () {
        mainImage.setAutoDraw(true); 
        mainQ.setAutoDraw(true); 
        progressBox.setAutoDraw(true); 
        progressBar.setAutoDraw(true);
        opt_boxes.forEach(b => b.setAutoDraw(true));

        if (mouse.getPressed()[0] === 0) window.mouseWasReleased = true;

        opt_texts.forEach(t => t.setAutoDraw(false));
        for (let i = 0; i < 8; i++) {
            if (opt_boxes[i].contains(mouse)) {
                opt_boxes[i].setFillColor(COLOR_HOVER);
            } else {
                opt_boxes[i].setFillColor(COLOR_DEFAULT);
            }
        }
        opt_texts.forEach(t => t.setAutoDraw(true));

        // --- CLICK DETECTION ---
        if (mouse.getPressed()[0] === 1 && window.mouseWasReleased) {
            for (let i = 0; i < 8; i++) {
                if (opt_boxes[i].contains(mouse)) {
                    let givenResponse = i + 1; 
                    let correctAnswer = parseInt(thisTrial['ANSWER']);
                    let isCorrect = (givenResponse === correctAnswer) ? 1 : 0;
                    
                    scores.TOTAL += isCorrect;
                    if (scores[blockName] !== undefined) scores[blockName] += isCorrect;

                    psychoJS.experiment.addData('response', givenResponse);
                    psychoJS.experiment.addData('rt', (routineClock.getTime() * 1000).toFixed(0));
                    psychoJS.experiment.addData('is_correct', isCorrect);

                    psychoJS.experiment.nextEntry();
                    return Scheduler.Event.NEXT;
                }
            }
        }
        return Scheduler.Event.FLIP_REPEAT;
    };
}

function routineEnd() {
    return async function () {
        [mainImage, mainQ, progressBox, progressBar, ...opt_boxes, ...opt_texts].forEach(s => s.setAutoDraw(false));
        return Scheduler.Event.NEXT;
    }
}

async function quitPsychoJS() {
    const totalTime = experimentClock ? experimentClock.getTime() : 0;

    psychoJS.experiment.addData('block', 'FINAL_SUMMARY');
    psychoJS.experiment.addData('score_TOTAL', `${scores.TOTAL}/16`);
    psychoJS.experiment.addData('score_LN', `${scores.LN}/4`);
    psychoJS.experiment.addData('score_VR', `${scores.VR}/4`);
    psychoJS.experiment.addData('score_3DR', `${scores['3DR']}/4`);
    psychoJS.experiment.addData('score_MX', `${scores.MX}/4`);
    psychoJS.experiment.addData('rt_total_ms', (totalTime * 1000).toFixed(0));
    psychoJS.experiment.nextEntry(); 

    const csvText = psychoJS.experiment.getResultAsCsv();
    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyQDX5lYwgiSkd6db2voDPiK_jgjba30R2irdBO82qYE6czj4HyclG1Uxa659vcW-xh/exec";
    const iframe = document.createElement('iframe');
    iframe.name = 'hidden_iframe';
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = GOOGLE_SCRIPT_URL;
    form.target = 'hidden_iframe'; 
    const filenameInput = document.createElement('input');
    filenameInput.type = 'hidden';
    filenameInput.name = 'filename';
    filenameInput.value = `${psychoJS.experiment.dataFileName}.csv`;
    form.appendChild(filenameInput);
    const dataInput = document.createElement('input');
    dataInput.type = 'hidden';
    dataInput.name = 'data';
    dataInput.value = csvText;
    form.appendChild(dataInput);
    document.body.appendChild(form);
    form.submit();
    setTimeout(() => {
        psychoJS.window.close();
        psychoJS.quit();
    }, 3000);
    return Scheduler.Event.QUIT;
}

function trialsLoopEnd() { return Scheduler.Event.NEXT; }
function importConditions(s) { return async function () { psychoJS.importAttributes(s); return Scheduler.Event.NEXT; }; }
