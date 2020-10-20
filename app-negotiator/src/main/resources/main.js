"use strict";

class Publisher {
    constructor() {
        this.subscriptions = new Set();
    }

    publish(topic, data) {
        let isReceived = false;
        try {
            for (const [topic0, callback] of this.subscriptions) {
                if (topic === topic0) {
                    try {
                        isReceived = true;
                        callback(data);
                    }
                    catch (error) {
                        console.log("Failed to publish '" + topic + "' to one subscriber", error);
                    }
                }
            }
        }
        finally {
            if (!isReceived) {
                console.log("Event with topic '" + topic + "' and data (" +
                    data + ") not received by any subscriber");
            }
        }
    }

    subscribe(topic, callback) {
        const subscription = [topic, callback];
        this.subscriptions.add(subscription);
        return subscription;
    }

    unsubscribe(subscription) {
        this.subscriptions.delete(subscription);
    }
}

const global = {
    publisher: new Publisher(),
    
    publish: (...args) => global.publisher.publish(...args),
    subscribe: (...args) => global.publisher.subscribe(...args),
    unsubscribe: (...args) => global.publisher.unsubscribe(...args),

    me: "plant",

    parties: [
        {
            name: "plant",
            label: "Final Assembly Plant"
        },
        {
            name: "carrier",
            label: "Carrier"
        },
        {
            name: "supplier",
            label: "Component Supplier"
        }
    ],

    partyByName(name) {
        for (const party of global.parties) {
            if (party.name === name) {
                return party;
            }
        }
        throw "No party named '" + name + "' is known"; 
    },

    deleteJson: (url, headers) => {
        return global.requestJson("DELETE", url, headers || {}, undefined);
    },

    getJson: (url, headers) => {
        return global.requestJson("GET", url, headers || {}, undefined);
    },

    postJson: (url, headers, payload) => {
        if (typeof payload === "undefined") {
            payload = headers;
            headers = {};
        }
        return global.requestJson("POST", url, headers || {}, payload);
    },

    requestJson: (method, url, headers, payload) => {
        if (!headers) {
            headers = {accept: "application/json"};
        }
        else if (!headers.accept) {
             headers.accept = "application/json";
        }
        if (payload && typeof payload === "object") {
            payload = JSON.stringify(payload);
        }
        if (payload) {
            headers["content-type"] = "application/json";
        }
        return global.request(method, url, headers, payload)
            .then((xhr) => {
                if (typeof xhr.responseText === "undefined" || xhr.responseText.length === 0) {
                    return null;
                }
                var contentType = (xhr.getResponseHeader("content-type") || "").trim().toLowerCase();
                if (!contentType.startsWith("application/json")) {
                    throw {
                        "name": "badResponseType",
                        "message": "Expected JSON-formatted response from server; received `" + contentType + "`.",
                        "data": xhr
                    };
                }
                return JSON.parse(xhr.responseText);
            });
    },

    request: (method, url, headers, payload) => {
        return new Promise((resolve, reject) => {
            var xhr = new XMLHttpRequest();
            xhr.timeout = 3000; // 3 seconds.
            xhr.open(method, url);
            xhr.addEventListener("load", function() {
                if (this.status >= 200 && this.status <= 299) {
                    resolve(this);
                }
                else {
                    reject({
                        "name": "badResponseStatus",
                        "message": "An unexpected status code was received from server (" + this.status + ").",
                        "data": this
                    });
                }
            });
            xhr.addEventListener("error", function() {
                reject({
                    "name": "error",
                    "message": "Failed to send request to server.",
                    "data": this
                });
            });
            xhr.addEventListener("timeout", function() {
                reject({
                    "name": "timeout",
                    "message": "Server failed to respond to sent request within " + (xhr.timeout / 1000.0) +
                        " seconds.",
                    "data": this
                });
            });
            for (var [key, value] of Object.entries(headers)) {
                xhr.setRequestHeader(key, value.toString());
            }
            xhr.send(payload);
        });
    },
};

class Widget {
    constructor(elementOrTagName = "div", attributes = {}, children = []) {
        if (elementOrTagName instanceof Node) {
            this.$element = elementOrTagName;
        }
        else {
            this.$element = document.createElement(elementOrTagName);
        }
        this.$element.___widget = this;
        this.children = [];

        for (const [key, value] of Object.entries(attributes)) {
            this.$element.setAttribute(key, value);
        }
        for (const child of children) {
            this.appendChild(child);
        }
    }

    appendChild(widgetOrNode) {
        let $node = this._widgetOrNodeToNode(widgetOrNode);
        if (!$node) {
            return;
        }
        this.$element.appendChild($node);
    }

    appendChildren(widgetsAndNodes) {
        let children;
        if (arguments.length != 1 || !Array.isArray(widgetsAndNodes)) {
            children = arguments;
        }
        else {
            children = widgetsAndNodes;
        }
        for (const widgetOrNode of children) {
            this.appendChild(widgetOrNode);
        }
    }

    prependChild(widgetOrNode) {
        let $node = this._widgetOrNodeToNode(widgetOrNode);
        if (!$node) {
            return;
        }
        this.$element.prepend($node);
    }

    _widgetOrNodeToNode(widgetOrNode) {
        if (widgetOrNode instanceof Widget) {
            return widgetOrNode.$element;
        }
        else if (widgetOrNode instanceof Node) {
            return widgetOrNode;
        }
        else if (widgetOrNode === null || widgetOrNode === undefined || widgetOrNode === "") {
            return undefined;
        }
        else {
            return document.createTextNode(widgetOrNode);
        }
    }

    getFirstChildMatching(predicate) {
        for (let child of this) {
            if (predicate(child)) {
                return child;
            }
        }
    }

    removeFirstChildMatching(predicate) {
        let i = 0;
        for (let child of this) {
            if (predicate(child)) {
                if (child instanceof Widget) {
                    child = child.$element;
                }
                child.remove();
                break;
            }
            i++;
        }
    }

    clearChildren() {
        this.$element.innerText = "";
    }

    [Symbol.iterator]() {
        const inner = this.$element.childNodes.values(); 
        return {
            next: () => {
                const item = inner.next();
                if (!item.done) {
                    const widget = item.value.___widget;
                    if (widget) {
                        return {value: widget, done: false};
                    }
                }
                return item;
            }
        };
    }

    addClass(className) {
        this.$element.classList.add(className);
    }

    hasClass(className) {
        return this.$element.classList.contains(className);
    }

    removeClass(className) {
        this.$element.classList.remove(className);
    }

    on(eventName, callback) {
        this.$element.addEventListener(eventName, callback);
        return { cancel: () => this.$element.removeEventListener(eventName, callback) };
    }
}

class Action extends Widget {
    constructor(className, label, callback) {
        super("a", {"class": "Action " + className}, [label]);
        this.on("click", () => {
            try {
                document.getSelection().removeAllRanges();
            }
            finally {
                this.callback();
            }
        });
        this.callback = callback;
    }
}

class Card extends Widget {
    constructor(className, label, children = [], footer = []) {
        super("div", {"class": "Card " + className});
        this.head = new Widget("div", {"class": "Head"}, [label]);
        this.body = new Widget("div", {"class": "Body"}, children);        
        this.foot = new Widget("div", {"class": "Foot"}, [
            this.left = new Widget("div", {"class": "Left"}, footer),
            this.status = new Status("hidden"),
        ])
        this.appendChildren(this.head, this.body, this.foot);
    }

    getInput() {
        const map = new Map();
        for (const nodeOrWidget of this.body) {
            if (nodeOrWidget instanceof InputField) {
                const value = nodeOrWidget.getValue();
                if ((value || "").trim().length === 0) {
                    nodeOrWidget.addClass("error");
                }
                else {
                    nodeOrWidget.removeClass("error");
                }
                map.set(nodeOrWidget.name, value);
            }
        }
        return map;
    }
}

class InputField extends Widget {
    constructor(name, label = null, value = null, isEditable = true) {
        super("span", {"class": "InputField " + name});
        this.name = name;
        this.label = label || name;
        if (value !== null) {
            this.isEmpty = false;
            this.$element.innerText = value;
        }
        else {
            this.isEmpty = true;
        }
        this.setEditable(isEditable); 
        this.on("keypress", event => {
            if (event.keyCode === 10 || event.keyCode === 13) {
                event.preventDefault();
                this.$element.blur();
            }
        });
    }

    getValue() {
        return this.isEmpty ? "" : (this.$element.innerText || "").trim();
    }

    setEditable(isEditable) {
        if (this.isEmpty) {
            this.$element.innerText = this.label;
            this.addClass("empty");
        }
        if (isEditable) {
            this._focusin = this.on("focusin", () => {
                if (this.isEmpty) {
                    this.$element.innerText = "";
                    this.removeClass("empty");
                    this.isEmpty = false;
                }
                else {
                    const selection = document.getSelection();
                    selection.removeAllRanges();

                    const range = document.createRange();
                    range.selectNodeContents(this.$element);
                    selection.addRange(range);
                }
            });
            this._focusout = this.on("focusout", () => {
                if ((this.$element.innerText || "").trim().length === 0) {
                    this.$element.innerText = this.label;
                    this.addClass("empty");
                    this.isEmpty = true;
                }
                else {
                    this.removeClass("empty");
                    this.isEmpty = false;
                }
            })
        }
        else {
            if (this._focusin) {
                this._focusin.cancel();
                delete this._focusin;
            }
            if (this._focusout) {
                this._focusout.cancel();
                delete this._focusout;   
            }
        }
        this.$element.setAttribute("contentEditable", isEditable ? "true" : "false");
    }
}

class InputSelector extends Widget {
    constructor(name, label, alternatives, selected = null) {
        super("select", {"class": "InputSelector " + name});
        this.$element.name = name;

        const options = [];
        for (let i = 0; i < alternatives.length; i++) {
            const alternative = alternatives[i];
            let widget = new Widget("option", {}, [alternative.label]);
            widget.$element.value = alternative.name;
            if (i === selected) {
                widget.$element.selected = "selected";
            }
            options.push(widget);
        }
        this.appendChildren(options);
    }

    getValue() {
        return this.$element.value || "";
    }
}

class Layout extends Widget {
    constructor(className, label, children = []) {
        super("section", {"class": "Layout " + className});
        this.head = new Widget("h1", {}, [label]);
        this.body = new Widget("div", {"class": "Body"}, children);
        this.appendChildren(this.head, this.body);
    }
}

class Modal extends Widget {
    constructor($element) {
        super($element);

        const styles = window.getComputedStyle($element);

        this._display = styles.getPropertyValue("display");

        const transitionDuration = styles.getPropertyValue("transition-duration");
        this._delay = transitionDuration
            ? parseFloat(transitionDuration) || 0
            : 0;

        $element.addEventListener("click", event => {
            if (event.target === $element) {
                this.hide();
            }
        });
        this.$element.style.display = "none";
    }

    hide() {
        this.removeClass("visible");
        if (this._delay > 0) {
            setTimeout(() => this.$element.style.display = "none", this._delay * 1000);
        }
        else {
            this.$element.style.display = value;
        }
    }

    show() {
        this.$element.style.display = this._display;
        setTimeout(() => this.addClass("visible"));
    }
}

class CounterOfferDialog extends Card {
    constructor(id, offer) {
        const labelWithReceiver = new Widget("span", {}, [
            "Make Counter-Offer ", new Widget("i", {}, [template.label]), " for ", new InputField(
                "receiver", "receiver", global.partyByName(offer.receiver).label, false
            ),
        ]);
        super("CounterOfferDialog", labelWithReceiver, templateTextToStringsAndWidgets(template.text, offer.contract, true), [
            new Action("submit", "Submit Counter-Offer", () => {
                const submission = this.validateAndCollectSubmission();
                if (submission) {
                    global.publish("offer.counter", submission);
                    global.publish("dialog.hide");
                }
            }),
            new Action("cancel", "Cancel", () => global.publish("dialog.hide")),
        ]);
        this.offer = offer;
    }

    validateAndCollectSubmission() {
        let hasError = false;

        const receiver = this.offer.receiver.getValue();
        const contract = this.getInput();
        for (const [key, value] of contract.entries()) {
            if ((value || "").trim().length === 0) {
                hasError = true;
            }
        }
        return hasError
            ? null
            : {receiver, contract, template: this.offer.template};
    }
}

class OfferDialog extends Card {
    constructor(template) {
        let receiver;
        const labelWithPartySelector = new Widget("span", {}, [
            "Offer ", new Widget("i", {}, [template.label]), " to ", receiver = new InputSelector(
                "receiver", "receiver", global.parties.filter(party => party.name !== global.me)
            )
        ]);
        super("OfferDialog", labelWithPartySelector, templateTextToStringsAndWidgets(template.text, {}, true), [
            new Action("submit", "Submit Offer", () => {
                const submission = this.validateAndCollectSubmission();

                if (submission) {
                    global.publish("offer.submit", submission);
                    global.publish("dialog.hide");
                }
            }),
            new Action("cancel", "Cancel", () => global.publish("dialog.hide")),
        ]);
        this.receiver = receiver;
        this.template = template;
    }

    validateAndCollectSubmission() {
        let hasError = false;

        const receiver = this.receiver.getValue();
        if (!receiver) {
            this.receiver.addClass("error");
            hasError = true;
        }
        const contract = this.getInput();
        for (const [key, value] of contract.entries()) {
            if ((value || "").trim().length === 0) {
                hasError = true;
            }
        }
        return hasError
            ? null
            : {receiver, contract, template: this.template};
    }
}

class Status extends Widget {
    constructor() {
        super("div", {"class": "Status hidden"});
        this.name = "hidden";
        this.on("click", () => this.setHidden());
    }

    set(className, text) {
        if (this.name) {
            this.removeClass(this.name);
        }
        this.name = className;
        this.addClass(className);
        this.$element.innerText = text;
    }

    setError(text) {
        this.set("error", text);
    }

    setHidden() {
        this.set("hidden", "");
    }

    setInfo(text) {
        this.set("info", text);
    }

    setOk(text) {
        this.set("ok", text);
    }

    setWarning(text) {
        this.set("warning", text);
    }
}

class Contract extends Card {
    constructor(id, label, data, text, signatories) {
        const labelWithId = new Widget("span", {}, [
            label, new Widget("span", {"class":"meta"}, [" [", id, "]"])
        ]);
        super("Contract", labelWithId, templateTextToStringsAndWidgets(text, data, false), [
            new Widget("span", {"class": "Label"}, ["Signatories:"]),
            ...signatories.map(signatory => new Widget("span", {"class": "Signatory"}, [signatory]))]);
    }
}

class ContractReceived extends Card {
    constructor(id, label, signatories, sender) {
        const labelWithTimestampAndSender = new Widget("div", {}, [
            new Widget("div", {"class": "timestamp"}, [new Date().toISOString()]),
            new Widget("div", {}, [
                "Received ",
                new Widget("i", {}, [label]),
                " from ",
                new Widget ("i", {}, [sender])
            ]),
        ]);
        super("ContractReceived", labelWithTimestampAndSender, [
            new Widget("span", {"class": "label"}, ["ID: "]),
            new Widget("span", {"class": "value"}, [id]),
            new Widget("span", {"class": "label"}, ["Signatories: "]),
            new Widget("span", {"class": "value"}, signatories.map(signatory => {
                return new Widget("span", {"class": "signatory"}, [signatory]);
            })),
        ], [
            new Widget("span", {"class": "Label"}, [
                "Saved to 'Contracts' section."
            ]),
        ]);
    }
}

class MessageSent extends Card {
    constructor(id, offer, className, actionLabel, directionLabel, message) {
        const timestamp = new Widget("div", {"class": "timestamp"}, [new Date().toISOString()]);
        const labelWithIdTimestampAndReceiver = new Widget("div", {}, [
            timestamp,
            new Widget("div", {}, [
                actionLabel + " ",
                new Widget("i", {}, [offer.template.label]),
                new Widget("span", {"class":"meta"}, [" [", id, "]"]),
                " " + directionLabel + " ",
                new Widget ("i", {}, [global.partyByName(offer.receiver).label])
            ]),
        ]);
        const text = templateTextToStringsAndWidgets(offer.template.text, offer.contract, false);
        super(className, labelWithIdTimestampAndReceiver, text, message ? [
            new Widget("span", {"class": "Label"}, [message]),
        ] : null);
        this.id = id;
    }
}

class AcceptSent extends MessageSent {
    constructor(id, offer) {
        super(id, offer, "AcceptSent", "Accepted", "from", "Accepted contract saved to 'Contracts' section.");
    }
}

class OfferSent extends MessageSent {
    constructor(id, offer) {
        super(id, offer, "OfferSent", "Offered", "to", "Awaiting response ...");
    }
}

class CounterOfferSent extends MessageSent {
    constructor(id, offer) {
        super(id, offer, "CounterOfferSent", "Countered ", "from", "Awaiting response ...")
    }
}

class RejectSent extends MessageSent {
    constructor(id, offer) {
        super(id, offer, "RejectSent", "Rejected", "from");
    }
}

class MessageReceived extends Card {
    constructor(id, offer, className, actionName, children) {
        const timestamp = new Widget("div", {"class": "timestamp"}, [new Date().toISOString()]);
        const labelWithIdTimestampAndSender = new Widget("div", {}, [
            timestamp,
            new Widget("div", {}, [
                new Widget ("i", {}, [global.partyByName(offer.sender).label]),
                " " + actionName + " ",
                new Widget("i", {}, [offer.template.label]),
                new Widget("span", {"class":"meta"}, [" [", id, "]"]),
                " from ",
                
            ]),
        ]);
        const text = templateTextToStringsAndWidgets(offer.template.text, offer.contract, false);
        super(className, labelWithIdTimestampAndReceiver, text, children);
        this.id = id;
    }
}

class AcceptReceived extends MessageReceived {
    constructor(id, offer) {
        super(id, offer, "AcceptReceived", "Accepted", [
            new Widget("span", {"class": "Label"}, ["Accepted contract saved to 'Contracts' section."])
        ]);
    }
}

class OfferReceived extends MessageReceived {
    constructor(id, offer) {
        super(id, offer, "OfferReceived", "Offered", [
            new Action("accept", "Accept", () => global.publish("offer.accept", {id, offer})),
            new Action("counter", "Counter", () => global.publish("dialog.show.counterOffer", {id, offer})),
            new Action("reject", "Reject", () => global.publish("offer.reject", {id, offer})),
        ]);
    }
}

class CounterOfferReceived extends MessageReceived {
    constructor(id, offer) {
        super(id, offer, "CounterOfferReceived", "Countered", [
            new Action("accept", "Accept", () => global.publish("offer.accept", {id, offer})),
            new Action("counter", "Counter", () => global.publish("dialog.show.counterOffer", {id, offer})),
            new Action("reject", "Reject", () => global.publish("offer.reject", {id, offer})),
        ]);
    }
}

class RejectReceived extends MessageReceived {
    constructor(id, offer) {
        super(id, offer, "RejectReceived", "Rejected");
    }
}

class Template extends Card {
    constructor(template) {
        super("Template", template.label, templateTextToStringsAndWidgets(template.text, {}, false), [
            new Action("offer", "New Offer", () => global.publish("dialog.show.offer", template)),
        ]);
    }
}

function templateTextToStringsAndWidgets(text, data = {}, areEditable = false) {
    const result = [];
    let t0 = 0;
    let t1 = 0;
    const t2 = text.length;
    while (t1 < t2) {
        if (text.charAt(t1) === "{") {
            result.push(text.substring(t0, t1++));
            t0 = t1;
            while (t1 < t2) {
                if (text.charAt(t1) === "}") {
                    const name = text.substring(t0, t1++);
                    t0 = t1;

                    const value = data instanceof Map ? data.get(name) : data[name];
                    result.push(new InputField(name, name, value, areEditable));
                    break;
                }
                else {
                    t1++;
                }
            }
        }
        else {
            t1++;
        }
    }
    if (t0 < t2) {
        result.push(text.substring(t0, t2));
    }
    return result;
}

function main() {
    const root = new Widget(document.getElementById("root"));
    const modal = new Modal(document.getElementById("modal"));

    const layoutTemplates = new Layout("templates", "Contract Templates");
    const layoutInbox = new Layout("inbox", "Negotiation Inbox");
    const layoutContracts = new Layout("contracts", "Contracts");
    root.appendChildren(layoutTemplates, layoutInbox, layoutContracts);

    const refresh = () => {
        console.clear();
        console.log("Refreshing!");

        global.getJson("/ui/me")
            .then(me => global.me = me.name);

        global.getJson("/ui/parties")
            .then(parties => global.parties = parties);

        global.getJson("/ui/templates")
            .then(templates => {
                layoutTemplates.clearChildren();
                layoutTemplates.appendChildren(templates);
            });

        global.deleteJson("/ui/inbox/entries")
            .then(entries => {
                for (const entry of entries) {
                    let child;
                    switch (entry.type) {
                    case "CONTRACT":
                        child = new ContractReceived(entry.id, entry.contract.label, entry.contract.signatories, entry.contract.sender);
                        break;
                    case "OFFER_ACCEPT":
                        child = new AcceptReceived(entry.id, entry.offer);
                        break;
                    case "OFFER_COUNTER":
                        child = new CounterOfferReceived(entry.id, entry.offer);
                        break;
                    case "OFFER_FAULT":
                        child = layoutInbox.body.getFirstChildMatching(child => {
                            return child instanceof Widget && child.id === entry.id;
                        });
                        if (child) {
                            child.status.setError(entry.error);
                        }
                        continue;
                    case "OFFER_EXPIRY":
                        child = layoutInbox.body.getFirstChildMatching(child => {
                            return child instanceof Widget && child.id === entry.id;
                        });
                        if (child) {
                            child.status.setWarning("This offer has expired.");
                        }
                        continue;
                    case "OFFER_REJECT":
                        child = new RejectReceived(entry.id, entry.offer);
                        break;
                    case "OFFER_SUBMIT":
                        child = new OfferReceived(entry.id, entry.offer);
                        break;
                    default:
                        console.log("Received entry with unexpected type", entry);
                        continue;
                    }
                    if (entry.id) {
                        layoutInbox.body.removeFirstChildMatching(child => {
                            return child instanceof Widget && child.id === entry.id;
                        });
                    }
                    layoutInbox.body.prependChild(child);
                }
            });
    };
    refresh();
    setInterval(refresh, 10000);
    document.getElementById("refresh")
        .addEventListener("click", () => global.publish("refresh"));

    global.subscribe("dialog.hide", () => {
        modal.hide();
    });

    global.subscribe("dialog.show.offer", template => {
        modal.clearChildren();
        modal.appendChild(new OfferDialog(template));
        modal.show();
    });

    global.subscribe("dialog.show.counterOffer", entry => {
        modal.clearChildren();
        modal.appendChild(new CounterOfferDialog(entry.id, entry.offer));
        modal.show();
    });

    global.subscribe("offer.submit", offer => {
        global.postJson("/ui/offers", {}, offer)
            .then(response => {
                layoutInbox.body.prependChild(new OfferSent(response.id, offer));
            });
    });

    const handleEntryError = error => {
        const entry0 = layoutInbox.getFirstChildMatching(child => {
            return child instanceof Widget && child.id === entry.id;
        });
        if (entry0) {
            entry0.status.setError(JSON.stringify(error));
        }
        else {
            console.log(error);
        }
    };

    global.subscribe("offer.accept", entry => {
        layoutInbox.body.removeFirstChildMatching(child => {
            return child instanceof Widget && child.id === entry.id;
        });
        layoutInbox.body.prependChild(new AcceptSent(entry.id, entry.offer));
        global.postJson("/ui/acceptances", {}, entry)
            .catch(handleEntryError);
    });

    global.subscribe("offer.counter", entry => {
        layoutInbox.body.removeFirstChildMatching(child => {
            return child instanceof Widget && child.id === entry.id;
        });
        layoutInbox.body.prependChild(new CounterOfferSent(entry.id, entry.offer));
        global.postJson("/ui/counter-offers", {}, entry)
            .catch(handleEntryError);
    });

    global.subscribe("offer.reject", entry => {
        layoutInbox.body.removeFirstChildMatching(child => {
            return child instanceof Widget && child.id === entry.id;
        });
        layoutInbox.body.prependChild(new RejectSent(entry.id, entry.offer));
        global.postJson("/ui/rejections", {}, entry)
            .catch(handleEntryError);
    });

    global.subscribe("refresh", refresh);
}
window.addEventListener("load", main);