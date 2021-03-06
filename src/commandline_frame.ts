/** Script used in the commandline iframe. Communicates with background. */

import * as Messaging from './messaging'
import * as SELF from './commandline_frame'

let completions = window.document.getElementById("completions") as HTMLElement
let clInput = window.document.getElementById("tridactyl-input") as HTMLInputElement

export let focus = () => clInput.focus()

async function sendExstr(exstr) {
    Messaging.message("commandline_background", "recvExStr", [exstr])
}

/* Process the commandline on enter. */
clInput.addEventListener("keydown", function (keyevent) {
    if (keyevent.key === "Enter") {
        process()
    }
    if (keyevent.key === "Escape") {
        /** Bug workaround: clInput cannot be cleared during an "Escape"
         * keydown event, presumably due to Firefox's internal handler for
         * Escape. So clear clInput just after :)
         *
         * TODO: Report this on bugzilla.
        */
        completions.innerHTML = ""
        setTimeout(()=>{clInput.value = ""}, 0)
        sendExstr("hidecmdline")
    }
})

/* Send the commandline to the background script and await response. */
function process() {
    console.log(clInput.value)
    sendExstr("hidecmdline")
    sendExstr(clInput.value)
    completions.innerHTML = ""
    clInput.value = ""
}

export function fillcmdline(newcommand?: string){
    if (newcommand != "") {
        clInput.value = newcommand + " "
    }
    // Focus is lost for some reason.
    focus()
}

export function changecompletions(newcompletions: string) {
    completions.innerHTML = newcompletions
}

function applyWithTmpTextArea(fn) {
    let textarea
    try {
        textarea = document.createElement("textarea")
        // Scratchpad must be `display`ed, but can be tiny and invisible.
        // Being tiny and invisible means it won't make the parent page move.
        textarea.style.cssText = 'visible: invisible; width: 0; height: 0; position: fixed'
        textarea.contentEditable = "true"
        document.documentElement.appendChild(textarea)
        return fn(textarea)
    } finally {
        document.documentElement.removeChild(textarea)
    }
}

export function setClipboard(content: string) {
    return applyWithTmpTextArea(scratchpad => {
        scratchpad.value = content
        scratchpad.select()
        if (document.execCommand("Copy")) {
            // // todo: Maybe we can consider to using some logger and show it with status bar in the future
            console.log('set clipboard:', scratchpad.value)
        } else throw "Failed to copy!"
    })
}

export function getClipboard() {
    return applyWithTmpTextArea(scratchpad => {
        scratchpad.focus()
        document.execCommand("Paste")
        console.log('get clipboard', scratchpad.textContent)
        return scratchpad.textContent
    })
}

Messaging.addListener('commandline_frame', Messaging.attributeCaller(SELF))
